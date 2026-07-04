"""
Embeddings Manager for RAG System
Handles text embedding generation using sentence-transformers
"""

from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
import hashlib

class EmbeddingsManager:
    """Manages text embedding generation with caching"""
    
    def __init__(self):
        self.cache: Dict[str, List[float]] = {}
        
        # Initialize sentence-transformers model
        print("Initializing embeddings model (all-mpnet-base-v2)...")
        self.model = SentenceTransformer('all-mpnet-base-v2')
        print("✓ Initialized embeddings: all-mpnet-base-v2")
        
        # Initialize BM25Encoder for sparse vectors (Hybrid Search)
        print("Initializing BM25Encoder for Hybrid Search...")
        try:
            from pinecone_text.sparse import BM25Encoder
            self.bm25 = BM25Encoder.default()
            print("✓ Initialized BM25Encoder")
        except ImportError:
            print("⚠️ pinecone-text not installed. Hybrid search disabled.")
            self.bm25 = None
    
    def _get_cache_key(self, text: str) -> str:
        """Generate cache key from text"""
        return hashlib.md5(text.encode()).hexdigest()
    
    def embed_text(self, text: str) -> tuple[List[float], Dict[str, Any]]:
        """
        Embed a single text string
        
        Args:
            text: Text to embed
            
        Returns:
            Tuple of (dense_embedding_list, sparse_embedding_dict)
        """
        # Generate dense embedding
        dense = self.model.encode(text, convert_to_numpy=True).tolist()
        
        # Generate sparse embedding (BM25)
        sparse = None
        if self.bm25:
            sparse = self.bm25.encode_documents([text])[0]
            
        return dense, sparse
    
    def embed_batch(self, texts: List[str], batch_size: int = 100) -> tuple[List[List[float]], List[Dict[str, Any]]]:
        """
        Embed multiple texts efficiently in batches
        
        Args:
            texts: List of texts to embed
            batch_size: Number of texts to process at once
            
        Returns:
            Tuple of (list_of_dense_embeddings, list_of_sparse_embeddings)
        """
        dense_embeddings = []
        sparse_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            print(f"Embedding batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}")
            
            # Dense
            dense_batch = self.model.encode(batch, convert_to_numpy=True).tolist()
            dense_embeddings.extend(dense_batch)
            
            # Sparse
            if self.bm25:
                sparse_batch = self.bm25.encode_documents(batch)
                sparse_embeddings.extend(sparse_batch)
            else:
                sparse_embeddings.extend([None] * len(batch))
        
        return dense_embeddings, sparse_embeddings
    
    def embed_query(self, query: str) -> tuple[List[float], Dict[str, Any]]:
        """
        Embed a query for retrieval
        
        Args:
            query: Search query text
            
        Returns:
            Tuple of (dense_query_embedding, sparse_query_embedding)
        """
        dense = self.model.encode(query, convert_to_numpy=True).tolist()
        
        sparse = None
        if self.bm25:
            sparse = self.bm25.encode_queries(query)
            
        return dense, sparse
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "cache_size": len(self.cache),
            "model": "sentence-transformers/all-mpnet-base-v2"
        }
    
    def clear_cache(self):
        """Clear the embedding cache"""
        self.cache.clear()
        print("✓ Embedding cache cleared")
