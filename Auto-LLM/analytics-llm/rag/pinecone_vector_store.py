"""
Pinecone Vector Store for RAG System
Uses Pinecone as a managed vector database with namespaces per business domain.
Single index: PINECONE_INDEX_NAME (dimension=384, metric=cosine)
One namespace per domain: projects, employees, tasks, leads, etc.
"""

from typing import List, Dict, Any, Optional
from config import AnalyticsLLMConfig
from rag.embeddings_manager import EmbeddingsManager


class PineconeVectorStore:
    """Manages Pinecone vector database operations using namespaces per domain"""

    def __init__(self):
        self.config = AnalyticsLLMConfig()
        self.embeddings_manager = EmbeddingsManager()

        # Import Pinecone here so startup fails clearly if package is missing
        try:
            from pinecone import Pinecone, ServerlessSpec
        except ImportError:
            raise ImportError(
                "pinecone is not installed. Run: pip install pinecone"
            )

        # Initialise Pinecone client
        pc = Pinecone(api_key=self.config.PINECONE_API_KEY)
        index_name = self.config.PINECONE_INDEX_NAME
        dimension = self.config.PINECONE_DIMENSION  # Must be 384 for all-MiniLM-L6-v2

        # Auto-create the index if it doesn't exist
        existing_indexes = [idx.name for idx in pc.list_indexes()]
        if index_name not in existing_indexes:
            print(f"⚙️  Pinecone index '{index_name}' not found — creating with dimension={dimension}, metric=dotproduct ...")
            pc.create_index(
                name=index_name,
                dimension=dimension,
                metric="dotproduct",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )
            print(f"✓ Created Pinecone index '{index_name}'")
        else:
            # Validate dimension of existing index
            index_info = pc.describe_index(index_name)
            existing_dim = index_info.dimension
            if existing_dim != dimension:
                raise ValueError(
                    f"\n\n❌ DIMENSION MISMATCH: Pinecone index '{index_name}' has dimension={existing_dim}, "
                    f"but the embedding model produces dimension={dimension}.\n"
                    f"→ Fix: Delete the index '{index_name}' on app.pinecone.io, then re-run the sync. "
                    f"The code will auto-create a new index with the correct dimension.\n"
                )

        self.index = pc.Index(index_name)
        print(
            f"✓ Pinecone Vector Store initialised — index: '{index_name}' (dim={dimension})"
        )


    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------

    def add_documents(
        self,
        collection_name: str,
        documents: List[str],
        metadatas: List[Dict[str, Any]],
        ids: List[str],
    ) -> bool:
        """
        Upsert documents into a Pinecone namespace.

        Args:
            collection_name: Used as the Pinecone namespace (e.g. 'projects').
            documents: Raw text strings (stored as metadata for retrieval).
            metadatas: Metadata dicts — one per document.
            ids: Unique vector IDs — one per document.

        Returns:
            True on success, False on failure.
        """
        try:
            print(f"Generating embeddings for {len(documents)} documents...")
            dense_embeddings, sparse_embeddings = self.embeddings_manager.embed_batch(documents)

            # Build Pinecone upsert payload
            # Each vector: (id, values, sparse_values, metadata)
            # We store the document text inside metadata so we can retrieve it.
            vectors = []
            for doc_id, doc_text, metadata, dense, sparse in zip(
                ids, documents, metadatas, dense_embeddings, sparse_embeddings
            ):
                pinecone_metadata = {k: str(v) if v is not None else "" for k, v in metadata.items()}
                pinecone_metadata["_document"] = doc_text[:10000]  # Pinecone metadata limit ~40 KB
                
                vec = {
                    "id": doc_id,
                    "values": dense,
                    "metadata": pinecone_metadata,
                }
                if sparse is not None:
                    vec["sparse_values"] = sparse
                    
                vectors.append(vec)

            # Upsert in batches of 100 (Pinecone recommended batch size)
            batch_size = 100
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i : i + batch_size]
                self.index.upsert(vectors=batch, namespace=collection_name)

            print(
                f"✓ Upserted {len(vectors)} vectors into namespace '{collection_name}'"
            )
            return True

        except Exception as e:
            print(f"❌ Error adding documents to Pinecone: {e}")
            import traceback
            traceback.print_exc()
            return False

    def update_document(
        self,
        collection_name: str,
        document_id: str,
        document: str,
        metadata: Dict[str, Any],
    ) -> bool:
        """
        Update a single document by re-upserting it.

        Args:
            collection_name: Namespace to update in.
            document_id: Unique vector ID.
            document: New document text.
            metadata: New metadata dict.

        Returns:
            True on success, False on failure.
        """
        return self.add_documents(
            collection_name=collection_name,
            documents=[document],
            metadatas=[metadata],
            ids=[document_id],
        )

    def delete_documents(self, collection_name: str, ids: List[str]) -> bool:
        """
        Delete vectors from a namespace by ID.

        Args:
            collection_name: Namespace to delete from.
            ids: List of vector IDs to delete.

        Returns:
            True on success, False on failure.
        """
        try:
            self.index.delete(ids=ids, namespace=collection_name)
            print(f"✓ Deleted {len(ids)} vectors from namespace '{collection_name}'")
            return True
        except Exception as e:
            print(f"❌ Error deleting documents from Pinecone: {e}")
            return False

    # ------------------------------------------------------------------
    # Read / search operations
    # ------------------------------------------------------------------

    def search(
        self,
        collection_name: str,
        query: str,
        n_results: int = None,
        where: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Semantic search inside a Pinecone namespace.

        Args:
            collection_name: Namespace to search (e.g. 'employees').
            query: Natural-language query string.
            n_results: Number of top results to return.
            where: Metadata key-value filter dict (e.g. {"status": "active"}).

        Returns:
            Dict with keys: ids, documents, metadatas, distances.
        """
        empty = {"ids": [], "documents": [], "metadatas": [], "distances": []}

        try:
            n_results = n_results or self.config.TOP_K_RESULTS

            # Generate query embedding
            query_dense, query_sparse = self.embeddings_manager.embed_query(query)

            # Build optional metadata filter for Pinecone
            pinecone_filter = None
            if where:
                pinecone_filter = {k: {"$eq": str(v)} for k, v in where.items()}

            query_kwargs = {
                "vector": query_dense,
                "top_k": n_results,
                "namespace": collection_name,
                "include_metadata": True,
                "filter": pinecone_filter,
            }
            if query_sparse is not None:
                query_kwargs["sparse_vector"] = query_sparse

            response = self.index.query(**query_kwargs)

            matches = response.get("matches", [])

            if not matches:
                return empty

            ids = []
            documents = []
            metadatas = []
            distances = []

            for match in matches:
                ids.append(match["id"])
                meta = match.get("metadata", {})
                # Extract stored document text; remove internal key before returning metadata
                doc_text = meta.pop("_document", "")
                documents.append(doc_text)
                metadatas.append(meta)
                # Pinecone returns score (cosine similarity); convert to distance
                distances.append(1.0 - float(match.get("score", 0.0)))

            return {
                "ids": ids,
                "documents": documents,
                "metadatas": metadatas,
                "distances": distances,
            }

        except Exception as e:
            print(f"❌ Pinecone search error in namespace '{collection_name}': {e}")
            import traceback
            traceback.print_exc()
            return empty

    def search_all_collections(
        self,
        query: str,
        n_results_per_collection: int = 3,
    ) -> Dict[str, Dict[str, Any]]:
        """
        Search across all known namespaces.

        Args:
            query: Search query text.
            n_results_per_collection: Results per namespace.

        Returns:
            Dict mapping namespace names to search results.
        """
        namespaces = [
            "projects", "employees", "tasks", "leads", "companies",
            "leaves", "attendances", "payrolls", "checkpoints",
            "revenue", "revenuetargets", "sales", "salestargets", "general",
        ]

        all_results = {}
        for ns in namespaces:
            results = self.search(
                collection_name=ns,
                query=query,
                n_results=n_results_per_collection,
            )
            if results["ids"]:
                all_results[ns] = results

        return all_results

    # ------------------------------------------------------------------
    # Management operations
    # ------------------------------------------------------------------

    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Return vector counts per namespace using Pinecone index stats.
        """
        try:
            stats = self.index.describe_index_stats()
            namespace_stats = stats.get("namespaces", {})

            result = {}
            for ns_name, ns_data in namespace_stats.items():
                result[ns_name] = {"count": ns_data.get("vector_count", 0)}

            return result
        except Exception as e:
            print(f"❌ Error fetching Pinecone index stats: {e}")
            return {}

    def reset_collection(self, collection_name: str) -> bool:
        """
        Delete all vectors in a namespace by deleting the namespace itself.

        Args:
            collection_name: Namespace to reset.

        Returns:
            True on success, False on failure.
        """
        try:
            self.index.delete(delete_all=True, namespace=collection_name)
            print(f"✓ Reset namespace '{collection_name}' in Pinecone")
            return True
        except Exception as e:
            print(f"❌ Error resetting Pinecone namespace '{collection_name}': {e}")
            return False

    def reset_all(self) -> bool:
        """Delete all vectors in the entire index."""
        try:
            self.index.delete(delete_all=True)
            print("✓ Reset entire Pinecone index")
            return True
        except Exception as e:
            print(f"❌ Error resetting Pinecone index: {e}")
            return False
