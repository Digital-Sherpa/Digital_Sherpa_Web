"""
MongoDB Service Module
Provides CRUD operations and business logic for place data.
"""
from typing import List, Optional, Dict, Any
from bson import ObjectId
from mongodb_config import get_places_collection, get_database


class PlaceService:
    """Service class for managing place data in MongoDB."""
    
    def __init__(self):
        self.collection = get_places_collection()
    
    def get_all_places(self, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
        """
        Retrieves all places from the database.
        
        Args:
            limit: Maximum number of results to return
            skip: Number of documents to skip (for pagination)
            
        Returns:
            List of place documents
        """
        cursor = self.collection.find().skip(skip).limit(limit)
        places = []
        for doc in cursor:
            doc['_id'] = str(doc['_id'])  # Convert ObjectId to string
            places.append(doc)
        return places
    
    def get_place_by_id(self, place_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a single place by its ID.
        
        Args:
            place_id: The MongoDB ObjectId as a string
            
        Returns:
            Place document or None if not found
        """
        try:
            doc = self.collection.find_one({"_id": ObjectId(place_id)})
            if doc:
                doc['_id'] = str(doc['_id'])
            return doc
        except Exception as e:
            print(f"Error fetching place by ID: {e}")
            return None
    
    def get_places_by_ids(self, place_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Retrieves multiple places by their IDs.
        
        Args:
            place_ids: List of MongoDB ObjectIds as strings
            
        Returns:
            List of place documents
        """
        try:
            object_ids = [ObjectId(pid) for pid in place_ids]
            cursor = self.collection.find({"_id": {"$in": object_ids}})
            places = []
            for doc in cursor:
                doc['_id'] = str(doc['_id'])
                places.append(doc)
            return places
        except Exception as e:
            print(f"Error fetching places by IDs: {e}")
            return []
    
    def get_place_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a place by its slug.
        
        Args:
            slug: The URL-friendly slug of the place
            
        Returns:
            Place document or None if not found
        """
        doc = self.collection.find_one({"slug": slug})
        if doc:
            doc['_id'] = str(doc['_id'])
        return doc
    
    def search_places_by_category(self, category: str) -> List[Dict[str, Any]]:
        """
        Searches for places by category.
        
        Args:
            category: The category to filter by
            
        Returns:
            List of matching place documents
        """
        cursor = self.collection.find({"category": {"$regex": category, "$options": "i"}})
        places = []
        for doc in cursor:
            doc['_id'] = str(doc['_id'])
            places.append(doc)
        return places
    
    def search_places_by_text(self, query: str) -> List[Dict[str, Any]]:
        """
        Performs a text search on places.
        Note: Requires a text index on the collection.
        
        Args:
            query: The search query
            
        Returns:
            List of matching place documents
        """
        # First, try to create a text index if it doesn't exist
        try:
            self.collection.create_index([
                ("name", "text"),
                ("description", "text"),
                ("tags", "text")
            ], name="text_search_index")
        except:
            pass  # Index might already exist
        
        cursor = self.collection.find(
            {"$text": {"$search": query}},
            {"score": {"$meta": "textScore"}}
        ).sort([("score", {"$meta": "textScore"})])
        
        places = []
        for doc in cursor:
            doc['_id'] = str(doc['_id'])
            places.append(doc)
        return places
    
    def get_places_for_embedding(self) -> List[Dict[str, Any]]:
        """
        Retrieves all places with fields needed for embedding generation.
        Optimized projection to only fetch necessary fields.
        
        Returns:
            List of place documents with embedding-relevant fields
        """
        projection = {
            "_id": 1,
            "name": 1,
            "description": 1,
            "category": 1,
            "tags": 1,
            "coordinates": 1
        }
        cursor = self.collection.find({}, projection)
        places = []
        for doc in cursor:
            doc['id'] = str(doc['_id'])  # Add id field for compatibility
            doc['_id'] = str(doc['_id'])
            places.append(doc)
        return places
    
    def count_places(self) -> int:
        """Returns the total count of places in the collection."""
        return self.collection.count_documents({})


# Convenience function for quick service access
def get_place_service() -> PlaceService:
    """Returns a PlaceService instance."""
    return PlaceService()


if __name__ == "__main__":
    # Test the service
    service = PlaceService()
    print(f"Total places: {service.count_places()}")
    
    places = service.get_all_places(limit=5)
    for place in places:
        print(f"- {place.get('name', 'Unknown')}: {place.get('category', 'N/A')}")
