"""
Data Ingestion Pipeline for RAG System
Syncs MongoDB data to vector database with incremental updates
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json
from data_fetcher import DataFetcher
from rag.document_processor import DocumentProcessor
from rag.pinecone_vector_store import PineconeVectorStore
from config import AnalyticsLLMConfig

class IngestionPipeline:
    """Manages data sync from MongoDB to vector database"""
    
    def __init__(self):
        self.config = AnalyticsLLMConfig()
        self.vector_store = PineconeVectorStore()
        self.document_processor = DocumentProcessor()
        self.data_fetcher = DataFetcher()
        self.last_sync = {}  # Track last sync time per collection

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _collect_chunks(
        self,
        raw_docs: list,
        process_fn,
    ) -> tuple:
        """
        Process a list of raw MongoDB dicts through process_fn, then chunk each
        resulting document with chunk_document().  Returns three parallel lists
        ready to pass straight into vector_store.add_documents().

        Args:
            raw_docs:   List of raw MongoDB dicts.
            process_fn: A DocumentProcessor method (e.g. process_project).

        Returns:
            (documents, metadatas, ids) — all expanded by chunking.
        """
        documents: list = []
        metadatas: list = []
        ids: list = []

        for raw in raw_docs:
            processed = process_fn(raw)
            for chunk in self.document_processor.chunk_document(processed):
                documents.append(chunk["text"])
                metadatas.append(chunk["metadata"])
                ids.append(chunk["id"])

        return documents, metadatas, ids
    
    def sync_all(self, category: Optional[str] = None) -> Dict[str, Any]:
        """
        Sync all data from MongoDB to vector database
        
        Args:
            category: Optional category filter (e.g., 'service-delivery')
            
        Returns:
            Sync statistics
        """
        print("\n" + "=" * 60)
        print("Starting Full Data Sync to Vector Database")
        if category:
            print(f"Category Filter: {category}")
        print("=" * 60 + "\n")
        
        start_time = datetime.now()
        stats = {
            "projects": 0,
            "employees": 0,
            "leaves": 0,
            "revenue": 0,
            "errors": []
        }
        
        try:
            # Connect to MongoDB
            self.data_fetcher.connect()
            
            # Sync projects
            print("\n📁 Syncing Projects...")
            projects_count = self._sync_projects(category)
            stats["projects"] = projects_count
            
            # Sync employees
            print("\n👥 Syncing Employees...")
            employees_count = self._sync_employees(category)
            stats["employees"] = employees_count
            
            # Sync leaves
            print("\n🏖️ Syncing Leave Requests...")
            leaves_count = self._sync_leaves(category)
            stats["leaves"] = leaves_count
            
            # Sync all other models using generic processor
            # Expanded map of visual name -> collection name
            additional_models = {
                "Tasks": "tasks",
                "Leads": "leads", 
                "Companies": "companies",
                "Attendance": "attendances",
                "Revenue Targets": "revenuetargets",
                "Sales": "sales",
                "Sales Targets": "salestargets",
                "Payroll": "payrolls",
                "Checkpoints": "checkpoints",
                # Additional collections
                "Users": "users",
                "Vendors": "vendors",
                "Inquiries": "inquiries",
                "Inventory Items": "inventory"
            }
            
            for visual_name, collection_name in additional_models.items():
                print(f"\n📦 Syncing {visual_name}...")
                try:
                    count = self._sync_generic_collection(collection_name, visual_name)
                    stats[collection_name] = count
                except Exception as e:
                    print(f"  ⚠️ Skipping {visual_name}: {str(e)}")
                    stats[collection_name] = 0
            
            # Disconnect from MongoDB
            self.data_fetcher.disconnect()
            
            # Update last sync time
            self.last_sync["full_sync"] = datetime.now().isoformat()
            
            duration = (datetime.now() - start_time).total_seconds()
            
            print("\n" + "=" * 60)
            print("✓ Sync Complete!")
            print(f"Duration: {duration:.2f} seconds")
            print(f"Projects: {stats['projects']}")
            print(f"Employees: {stats['employees']}")
            print(f"Leave Requests: {stats['leaves']}")
            print(f"Revenue Targets: {stats['revenue']}")
            print("=" * 60 + "\n")
            
            stats["duration"] = duration
            stats["success"] = True
            stats["timestamp"] = datetime.now().isoformat()
            
            return stats
            
        except Exception as e:
            print(f"\n❌ Sync failed: {e}")
            import traceback
            traceback.print_exc()
            
            stats["success"] = False
            stats["error"] = str(e)
            stats["errors"].append(str(e))
            
            return stats
    
    def _sync_projects(self, category: Optional[str] = None) -> int:
        """Sync projects to vector database"""
        try:
            projects_data = self.data_fetcher.fetch_projects_data(
                limit=1000,
                category=category
            )

            if not projects_data:
                print("  No projects found")
                return 0

            print(f"  Fetched {len(projects_data)} projects from MongoDB")

            documents, metadatas, ids = self._collect_chunks(
                projects_data, self.document_processor.process_project
            )

            success = self.vector_store.add_documents(
                collection_name="projects",
                documents=documents,
                metadatas=metadatas,
                ids=ids,
            )

            if success:
                print(f"  ✓ Synced {len(projects_data)} projects → {len(documents)} chunks to Pinecone")
                return len(projects_data)
            else:
                print("  ❌ Failed to sync projects")
                return 0

        except Exception as e:
            print(f"  ❌ Error syncing projects: {e}")
            import traceback
            traceback.print_exc()
            return 0
    
    def _sync_employees(self, category: Optional[str] = None) -> int:
        """Sync employees to vector database"""
        try:
            employees_data = self.data_fetcher.fetch_employee_reports(
                days=90,
                category=category
            )

            if not employees_data:
                print("  No employees found")
                return 0

            print(f"  Fetched {len(employees_data)} employees from MongoDB")

            documents, metadatas, ids = self._collect_chunks(
                employees_data, self.document_processor.process_employee
            )

            success = self.vector_store.add_documents(
                collection_name="employees",
                documents=documents,
                metadatas=metadatas,
                ids=ids,
            )

            if success:
                print(f"  ✓ Synced {len(employees_data)} employees → {len(documents)} chunks to Pinecone")
                return len(employees_data)
            else:
                print("  ❌ Failed to sync employees")
                return 0

        except Exception as e:
            print(f"  ❌ Error syncing employees: {e}")
            return 0

    def _sync_leaves(self, category: Optional[str] = None) -> int:
        """Sync leave requests to vector database"""
        try:
            leaves_data = self.data_fetcher.fetch_leave_requests(
                category=category,
                status_filter=None
            )

            if not leaves_data:
                print("  No leave requests found")
                return 0

            print(f"  Fetched {len(leaves_data)} leave requests from MongoDB")

            documents, metadatas, ids = self._collect_chunks(
                leaves_data, self.document_processor.process_leave
            )

            success = self.vector_store.add_documents(
                collection_name="leaves",
                documents=documents,
                metadatas=metadatas,
                ids=ids,
            )

            if success:
                print(f"  ✓ Synced {len(leaves_data)} leaves → {len(documents)} chunks to Pinecone")
                return len(leaves_data)
            else:
                print("  ❌ Failed to sync leave requests")
                return 0

        except Exception as e:
            print(f"  ❌ Error syncing leave requests: {e}")
            import traceback
            traceback.print_exc()
            return 0
    
    def _sync_generic_collection(self, collection_name: str, visual_name: str) -> int:
        """
        Generic sync for any collection
        
        Args:
            collection_name: Mongoose collection name (e.g., 'tasks')
            visual_name: Human readable name (e.g., 'Tasks')
            
        Returns:
            Count of documents synced
        """
        try:
            # Check if collection exists in database
            if not hasattr(self.data_fetcher.db, collection_name):
                print(f"  ⚠️ Collection '{collection_name}' not found in database, skipping...")
                return 0
            
            # Fetch data using generic fetcher
            data = self.data_fetcher.fetch_collection_data(collection_name)
            
            if not data:
                print(f"  No {visual_name} found")
                return 0
                
            # Process into documents using generic processor
            documents = []
            metadatas = []
            ids = []
            
            # Expanded doc type map
            doc_type_map = {
                "tasks": "task",
                "leads": "lead",
                "companies": "company",
                "attendances": "attendance",
                "revenuetargets": "revenue_target",
                "sales": "sale",
                "salestargets": "sales_target",
                "payrolls": "payroll",
                "checkpoints": "checkpoint",
                # New collections
                "users": "user",
                "vendors": "vendor",
                "inquiries": "inquiry",
                "inventory": "inventory_item"
            }
            doc_type = doc_type_map.get(collection_name, "general")

            documents, metadatas, ids = self._collect_chunks(
                data,
                lambda item: self.document_processor.process_generic_document(item, doc_type)
            )
    
            success = self.vector_store.add_documents(
                collection_name=collection_name,
                documents=documents,
                metadatas=metadatas,
                ids=ids,
            )
    
            if success:
                print(f"  ✓ Synced {len(data)} {visual_name} → {len(documents)} chunks to Pinecone")
                return len(data)
            else:
                print(f"  ❌ Failed to sync {visual_name}")
                return 0
                
        except Exception as e:
            print(f"  ❌ Error syncing {visual_name}: {e}")
            import traceback
            traceback.print_exc()
            return 0
    
    def incremental_sync(self, category: Optional[str] = None) -> Dict[str, Any]:
        """
        Perform incremental sync (only update changed documents)
        
        Args:
            category: Optional category filter
            
        Returns:
            Sync statistics
        """
        # For MVP, just do full sync
        # In production, track changes and only update modified documents
        print("Performing incremental sync (currently same as full sync)...")
        return self.sync_all(category=category)
    
    def reset_and_sync(self, category: Optional[str] = None) -> Dict[str, Any]:
        """
        Reset vector database and perform fresh sync
        
        Args:
            category: Optional category filter
            
        Returns:
            Sync statistics
        """
        print("\n⚠️  Resetting vector database...")
        
        # Reset collections
        self.vector_store.reset_collection("projects")
        self.vector_store.reset_collection("employees")
        self.vector_store.reset_collection("revenue")
        
        print("✓ Vector database reset complete\n")
        
        # Perform full sync
        return self.sync_all(category=category)
    
    def get_sync_status(self) -> Dict[str, Any]:
        """Get current sync status and statistics"""
        stats = self.vector_store.get_collection_stats()
        
        return {
            "collections": stats,
            "last_sync": self.last_sync,
            "total_documents": sum(col.get("count", 0) for col in stats.values())
        }
