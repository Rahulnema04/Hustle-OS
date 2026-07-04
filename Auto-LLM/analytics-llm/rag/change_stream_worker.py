"""
MongoDB Change Stream Worker for Real-Time Pinecone Sync
Watches MongoDB collections and automatically upserts/deletes vectors in Pinecone
whenever documents change — no manual re-sync needed.
"""

import threading
import time
from typing import Dict, List, Tuple, Optional
from pymongo import MongoClient
import certifi

# Collection name  →  (Pinecone namespace, document type label)
WATCHED_COLLECTIONS: List[Tuple[str, str, str]] = [
    ("projects",       "projects",       "project"),
    ("tasks",          "tasks",          "task"),
    ("users",          "employees",      "employee"),  # users collection → employees namespace
    ("leads",          "leads",          "lead"),
    ("companies",      "companies",      "company"),
    ("leaves",         "leaves",         "leave"),
    ("attendances",    "attendances",    "attendance"),
    ("payrolls",       "payrolls",       "payroll"),
    ("revenuetargets", "revenuetargets", "revenue_target"),
    ("sales",          "sales",          "sale"),
    ("salestargets",   "salestargets",   "sales_target"),
    ("checkpoints",    "checkpoints",    "checkpoint"),
]


class ChangeStreamWorker:
    """
    Watches MongoDB collections via Change Streams and keeps Pinecone in sync.
    Each collection is watched in its own daemon thread.
    """

    def __init__(self):
        from config import AnalyticsLLMConfig
        self.config = AnalyticsLLMConfig()
        self._threads: List[threading.Thread] = []
        self._stop_event = threading.Event()
        self._vector_store = None  # Lazy loaded
        self._doc_processor = None  # Lazy loaded

    # ------------------------------------------------------------------
    # Lazy-load heavy objects only when the first change arrives
    # ------------------------------------------------------------------

    def _get_vector_store(self):
        if self._vector_store is None:
            from rag.pinecone_vector_store import PineconeVectorStore
            self._vector_store = PineconeVectorStore()
        return self._vector_store

    def _get_doc_processor(self):
        if self._doc_processor is None:
            from rag.document_processor import DocumentProcessor
            self._doc_processor = DocumentProcessor()
        return self._doc_processor

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def start(self):
        """Start one watcher thread per collection."""
        print("🔄 [ChangeStream] Starting real-time Pinecone sync workers...")
        for col_name, namespace, doc_type in WATCHED_COLLECTIONS:
            t = threading.Thread(
                target=self._watch_collection,
                args=(col_name, namespace, doc_type),
                daemon=True,
                name=f"cs-{col_name}",
            )
            t.start()
            self._threads.append(t)
        print(
            f"✅ [ChangeStream] Watching {len(WATCHED_COLLECTIONS)} collections for real-time sync"
        )

    def stop(self):
        """Signal all watcher threads to stop."""
        self._stop_event.set()
        print("🛑 [ChangeStream] Stopping sync workers...")

    # ------------------------------------------------------------------
    # Per-collection watcher (runs in its own thread)
    # ------------------------------------------------------------------

    def _watch_collection(self, col_name: str, namespace: str, doc_type: str):
        """
        Opens a MongoDB change stream on `col_name` and reacts to events.
        Reconnects automatically if the connection drops.
        """
        # Load persisted resume token if it exists
        resume_token = self._load_resume_token(col_name)

        while not self._stop_event.is_set():
            client = None
            try:
                client = MongoClient(self.config.MONGODB_URI, tlsCAFile=certifi.where())
                db = client[self.config.DB_NAME]
                collection = db[col_name]

                # Pipeline: watch all operations
                pipeline = [{"$match": {"operationType": {"$in": ["insert", "update", "replace", "delete"]}}}]

                watch_kwargs: dict = {"pipeline": pipeline, "full_document": "updateLookup"}
                if resume_token:
                    watch_kwargs["resume_after"] = resume_token

                with collection.watch(**watch_kwargs) as stream:
                    for change in stream:
                        if self._stop_event.is_set():
                            break

                        resume_token = change.get("_id")
                        if resume_token:
                            self._save_resume_token(col_name, resume_token)
                        op = change.get("operationType")

                        try:
                            if op in ("insert", "update", "replace"):
                                self._handle_upsert(change, namespace, doc_type, col_name)
                            elif op == "delete":
                                self._handle_delete(change, namespace, doc_type)
                        except Exception as e:
                            print(f"⚠️  [ChangeStream:{col_name}] Error handling {op}: {e}")

            except Exception as e:
                if not self._stop_event.is_set():
                    print(
                        f"⚠️  [ChangeStream:{col_name}] Connection error: {e} — reconnecting in 5s..."
                    )
                    time.sleep(5)
            finally:
                if client:
                    try:
                        client.close()
                    except Exception:
                        pass

    # ------------------------------------------------------------------
    # Token Persistence
    # ------------------------------------------------------------------

    def _get_token_path(self, col_name: str) -> str:
        import os
        return os.path.join(os.path.dirname(__file__), "..", f".cs_token_{col_name}.json")

    def _load_resume_token(self, col_name: str) -> Optional[dict]:
        import os, json
        path = self._get_token_path(col_name)
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️  [ChangeStream] Error loading token for {col_name}: {e}")
        return None

    def _save_resume_token(self, col_name: str, token: dict):
        import json
        path = self._get_token_path(col_name)
        try:
            with open(path, "w") as f:
                json.dump(token, f)
        except Exception:
            pass

    # ------------------------------------------------------------------
    # Event handlers
    # ------------------------------------------------------------------

    def _handle_upsert(self, change: dict, namespace: str, doc_type: str, col_name: str):
        """Re-embed the changed document and upsert into Pinecone."""
        full_doc = change.get("fullDocument")
        if not full_doc:
            return  # update without fullDocument lookup (shouldn't happen with updateLookup)

        doc_id_raw = full_doc.get("_id")
        if doc_id_raw is None:
            return

        doc_id = f"{doc_type}_{doc_id_raw}"
        op = change.get("operationType", "update")

        try:
            processor = self._get_doc_processor()
            vector_store = self._get_vector_store()

            # Use the appropriate processor method based on doc type
            processed = self._process_document(processor, full_doc, doc_type)
            if not processed:
                return

            processed["id"] = doc_id  # Ensure base ID matches the required doc_type prefix

            documents = []
            metadatas = []
            ids = []
            
            for chunk in processor.chunk_document(processed):
                documents.append(chunk["text"])
                metadatas.append(chunk["metadata"])
                ids.append(chunk["id"])

            success = vector_store.add_documents(
                collection_name=namespace,
                documents=documents,
                metadatas=metadatas,
                ids=ids,
            )

            if success:
                print(
                    f"✓ [ChangeStream] {op.upper()} → upserted '{doc_id}' ({len(documents)} chunks) in namespace '{namespace}'"
                )
        except Exception as e:
            print(f"❌ [ChangeStream] Failed to upsert '{doc_id}': {e}")
            import traceback
            traceback.print_exc()

    def _handle_delete(self, change: dict, namespace: str, doc_type: str):
        """Delete the vector from Pinecone when a document is removed from MongoDB."""
        doc_id_raw = change.get("documentKey", {}).get("_id")
        if doc_id_raw is None:
            return

        base_id = f"{doc_type}_{doc_id_raw}"
        
        # We delete the base_id and up to 50 potential chunk suffixes.
        # Pinecone silently ignores IDs that don't exist.
        ids_to_delete = [base_id] + [f"{base_id}_c{i}" for i in range(50)]

        try:
            vector_store = self._get_vector_store()
            vector_store.delete_documents(namespace, ids_to_delete)
            print(
                f"✓ [ChangeStream] DELETE → removed '{base_id}' (and chunks) from namespace '{namespace}'"
            )
        except Exception as e:
            print(f"❌ [ChangeStream] Failed to delete '{base_id}': {e}")

    # ------------------------------------------------------------------
    # Document processing dispatch
    # ------------------------------------------------------------------

    def _process_document(
        self, processor, doc: dict, doc_type: str
    ) -> Optional[Dict]:
        """Route a raw MongoDB document to the appropriate DocumentProcessor method."""
        try:
            if doc_type == "project":
                return processor.process_project(self._normalize_project(doc))
            elif doc_type in ("employee", "user"):
                return processor.process_employee(self._normalize_employee(doc))
            elif doc_type == "leave":
                return processor.process_leave(self._normalize_leave(doc))
            else:
                # Generic fallback for tasks, leads, sales, etc.
                return processor.process_generic_document(doc, doc_type)
        except Exception as e:
            print(f"⚠️  [ChangeStream] process_document failed for type '{doc_type}': {e}")
            return None

    # ------------------------------------------------------------------
    # Light normalization helpers (mirrors DataFetcher logic)
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize_project(doc: dict) -> dict:
        from bson import ObjectId
        return {
            "id": str(doc.get("_id", "")),
            "name": doc.get("name", "Unnamed"),
            "description": doc.get("description", ""),
            "status": doc.get("status", "unknown"),
            "progress": doc.get("progress", 0),
            "completion_percentage": doc.get("completion_percentage", 0),
            "total_tasks": doc.get("total_tasks", 0),
            "completed_tasks": doc.get("completed_tasks", 0),
            "in_progress_tasks": doc.get("in_progress_tasks", 0),
            "not_started_tasks": doc.get("not_started_tasks", 0),
            "total_points": doc.get("total_points", 0),
            "completed_points": doc.get("completed_points", 0),
            "manager": doc.get("manager"),
            "created_by": doc.get("createdBy"),
            "created_at": str(doc.get("createdAt", "")),
            "deadline": str(doc.get("deadline", "")),
            "is_automated": doc.get("is_automated", False),
            "documentation": doc.get("documentation", ""),
        }

    @staticmethod
    def _normalize_employee(doc: dict) -> dict:
        return {
            "id": str(doc.get("_id", "")),
            "name": doc.get("name", "Unknown"),
            "employee_id": doc.get("employee_id", "N/A"),
            "role": doc.get("role", "Unspecified"),
            "department": doc.get("department", "Unspecified"),
            "email": doc.get("email", ""),
            "completion_rate": doc.get("completion_rate", 0),
            "on_time_rate": doc.get("on_time_rate", 0),
            "total_tasks": doc.get("total_tasks", 0),
            "completed_tasks": doc.get("completed_tasks", 0),
            "in_progress_tasks": doc.get("in_progress_tasks", 0),
            "not_started_tasks": doc.get("not_started_tasks", 0),
            "on_time_tasks": doc.get("on_time_tasks", 0),
            "late_tasks": doc.get("late_tasks", 0),
            "revision_tasks": doc.get("revision_tasks", 0),
            "review_tasks": doc.get("review_tasks", 0),
            "active_projects": doc.get("active_projects", 0),
            "total_points": doc.get("total_points", 0),
            "recent_points": doc.get("recent_points", 0),
            "all_time_tasks": doc.get("all_time_tasks", 0),
            "all_time_completed": doc.get("all_time_completed", 0),
            "joining_date": str(doc.get("joiningDate", "")),
            "last_login": str(doc.get("lastLogin", "")),
        }

    @staticmethod
    def _normalize_leave(doc: dict) -> dict:
        return {
            "id": str(doc.get("_id", "")),
            "employee_name": doc.get("employee_name", "Unknown"),
            "employee_id": doc.get("employee_id", "N/A"),
            "email": doc.get("email", ""),
            "role": doc.get("role", ""),
            "leave_type": doc.get("leaveType", "unspecified"),
            "start_date": str(doc.get("startDate", "")),
            "end_date": str(doc.get("endDate", "")),
            "total_days": doc.get("totalDays", 0),
            "is_half_day": doc.get("isHalfDay", False),
            "status": doc.get("status", "pending"),
            "manager_approval": doc.get("managerApproval", "pending"),
            "hr_approval": doc.get("hrApproval", "pending"),
            "approved_by": doc.get("approvedBy", "Pending"),
            "reason": doc.get("reason", ""),
            "applied_date": str(doc.get("createdAt", "")),
        }


# Singleton instance
_worker_instance: Optional[ChangeStreamWorker] = None


def get_change_stream_worker() -> ChangeStreamWorker:
    """Return the singleton ChangeStreamWorker, creating it if needed."""
    global _worker_instance
    if _worker_instance is None:
        _worker_instance = ChangeStreamWorker()
    return _worker_instance
