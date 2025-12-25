import faiss
import numpy as np
import json
import os
from sentence_transformers import SentenceTransformer

class SearchService:
    def __init__(self, faiss_index_path, metadata_path, model_name='all-MiniLM-L6-v2'):
        self.faiss_index_path = faiss_index_path
        self.metadata_path = metadata_path
        self.model_name = model_name
        self.index = None
        self.metadata = None
        self.model = None
        
        self.load_resources()

    def load_resources(self):
        """Loads the FAISS index, metadata, and the SentenceTransformer model."""
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

    def search(self, query, top_k=50):
        """
        Encodes the query, performs a FAISS search, and returns the closest results.
        
        Args:
            query (str): The search query.
            top_k (int): Number of top results to return.

        Returns:
            list: A list of result dictionaries containing place_id, distance, and metadata.
        """
        if not query:
            return []

        # Generate embedding
        query_embedding = self.model.encode([query])
        query_embedding = np.array(query_embedding).astype('float32')
        
        # Search FAISS index
        distances, indices = self.index.search(query_embedding, top_k)
        
        results = []
        # Support single query batch (first element)
        query_indices = indices[0]
        query_distances = distances[0]

        for i, idx in enumerate(query_indices):
            idx_str = str(idx) # JSON keys are strings
            if idx != -1 and idx_str in self.metadata:
                meta = self.metadata[idx_str]
                results.append({
                    "place_id": meta.get("place_id"),
                    "score": float(query_distances[i]),
                    "metadata": meta
                })
        
        return results

    def get_closest(self, query):
        """Returns the single closest result for the query."""
        results = self.search(query, top_k=1)
        if results:
            return results[0]
        return None
