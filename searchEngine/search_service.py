import faiss
import numpy as np
import json
import os
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional

# MongoDB imports (optional - gracefully handle if not configured)
try:
    from mongodb_service import PlaceService
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False
    print("⚠️  MongoDB service not available. Using local metadata only.")


class SearchService:
    """
    Search service that uses FAISS for vector similarity search.
    Supports both local metadata and MongoDB for fetching full place details.
    """
    
    def __init__(self, faiss_index_path: str, metadata_path: str, 
                 model_name: str = 'all-MiniLM-L6-v2', 
                 use_mongodb: bool = True):
        """
        Initialize the search service.
        
        Args:
            faiss_index_path: Path to the FAISS index file
            metadata_path: Path to the metadata JSON file
            model_name: Name of the SentenceTransformer model
            use_mongodb: Whether to fetch full details from MongoDB
        """
        self.faiss_index_path = faiss_index_path
        self.metadata_path = metadata_path
        self.model_name = model_name
        self.use_mongodb = use_mongodb and MONGODB_AVAILABLE
        
        self.index = None
        self.metadata = None
        self.model = None
        self.place_service = None
        
        self.load_resources()

    def load_resources(self):
        """Loads the FAISS index, metadata, model, and optionally MongoDB connection."""
        if not os.path.exists(self.faiss_index_path):
            raise FileNotFoundError(f"FAISS index not found at {self.faiss_index_path}")
        
        if not os.path.exists(self.metadata_path):
            raise FileNotFoundError(f"Metadata file not found at {self.metadata_path}")

        print(f"Loading FAISS index from {self.faiss_index_path}...")
        self.index = faiss.read_index(self.faiss_index_path)
        
        print(f"Loading metadata from {self.metadata_path}...")
        with open(self.metadata_path, 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)
            
        print(f"Loading SentenceTransformer model {self.model_name}...")
        self.model = SentenceTransformer(self.model_name)
        
        # Initialize MongoDB connection if enabled
        if self.use_mongodb:
            try:
                self.place_service = PlaceService()
                print("✅ MongoDB service initialized for enriched results.")
            except Exception as e:
                print(f"⚠️  Could not initialize MongoDB: {e}")
                print("   Falling back to local metadata only.")
                self.use_mongodb = False

    def search(self, query: str, top_k: int = 50, 
               include_full_details: bool = False) -> List[Dict[str, Any]]:
        """
        Encodes the query, performs a FAISS search, and returns the closest results.
        
        Args:
            query: The search query.
            top_k: Number of top results to return.
            include_full_details: If True and MongoDB is available, fetch full place details.

        Returns:
            List of result dictionaries containing place_id, score, and metadata.
        """
        if not query:
            return []

        # Generate embedding
        query_embedding = self.model.encode([query])
        query_embedding = np.array(query_embedding).astype('float32')
        
        # Search FAISS index
        distances, indices = self.index.search(query_embedding, top_k)
        
        results = []
        place_ids_to_fetch = []
        
        # Support single query batch (first element)
        query_indices = indices[0]
        query_distances = distances[0]

        for i, idx in enumerate(query_indices):
            idx_str = str(idx)  # JSON keys are strings
            if idx != -1 and idx_str in self.metadata:
                meta = self.metadata[idx_str]
                place_id = meta.get("place_id")
                results.append({
                    "place_id": place_id,
                    "score": float(query_distances[i]),
                    "metadata": meta,
                    "faiss_index": idx
                })
                if place_id:
                    place_ids_to_fetch.append(place_id)
        
        # Optionally enrich with MongoDB data
        if include_full_details and self.use_mongodb and self.place_service:
            results = self._enrich_with_mongodb(results, place_ids_to_fetch)
        
        return results

    def _enrich_with_mongodb(self, results: List[Dict[str, Any]], 
                              place_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Enriches search results with full place details from MongoDB.
        
        Args:
            results: List of search results with basic metadata
            place_ids: List of place IDs to fetch
            
        Returns:
            Enriched results with full place details
        """
        try:
            # Fetch all places in one query
            places = self.place_service.get_places_by_ids(place_ids)
            
            # Create a lookup map
            places_map = {place['_id']: place for place in places}
            
            # Enrich results
            for result in results:
                place_id = result.get('place_id')
                if place_id and place_id in places_map:
                    result['full_details'] = places_map[place_id]
            
            return results
        except Exception as e:
            print(f"Error enriching results from MongoDB: {e}")
            return results

    def search_with_full_details(self, query: str, top_k: int = 50) -> List[Dict[str, Any]]:
        """
        Convenience method that always includes full MongoDB details.
        
        Args:
            query: The search query.
            top_k: Number of top results to return.
            
        Returns:
            List of results with full place details from MongoDB.
        """
        return self.search(query, top_k=top_k, include_full_details=True)

    def get_closest(self, query: str, include_full_details: bool = False) -> Optional[Dict[str, Any]]:
        """
        Returns the single closest result for the query.
        
        Args:
            query: The search query.
            include_full_details: If True, fetch full details from MongoDB.
            
        Returns:
            The closest matching result or None.
        """
        results = self.search(query, top_k=1, include_full_details=include_full_details)
        if results:
            return results[0]
        return None

    def get_place_details(self, place_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches full place details from MongoDB by ID.
        
        Args:
            place_id: The place's MongoDB ObjectId as string.
            
        Returns:
            Full place document or None if not found.
        """
        if not self.use_mongodb or not self.place_service:
            return None
        
        return self.place_service.get_place_by_id(place_id)
