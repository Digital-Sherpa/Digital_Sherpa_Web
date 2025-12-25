"""
MongoDB Configuration and Connection Module
This module handles the connection to MongoDB Atlas and provides database access.
"""
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from typing import Optional

# Load environment variables
load_dotenv()

class MongoDBConfig:
    """MongoDB configuration and connection manager."""
    
    _client: Optional[MongoClient] = None
    _database = None
    
    @classmethod
    def get_client(cls) -> MongoClient:
        """
        Returns a MongoDB client instance (singleton pattern).
        Creates a new connection if one doesn't exist.
        """
        if cls._client is None:
            mongodb_uri = os.getenv("MONGODB_URI")
            
            if not mongodb_uri:
                raise ValueError(
                    "MONGODB_URI environment variable is not set. "
                    "Please create a .env file with your MongoDB connection string."
                )
            
            # Create a new client with Server API version 1
            cls._client = MongoClient(
                mongodb_uri,
                server_api=ServerApi('1'),
                maxPoolSize=50,
                minPoolSize=10,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000
            )
            
            # Verify the connection
            try:
                cls._client.admin.command('ping')
                print("✅ Successfully connected to MongoDB Atlas!")
            except Exception as e:
                print(f"❌ Failed to connect to MongoDB: {e}")
                raise
        
        return cls._client
    
    @classmethod
    def get_database(cls):
        """Returns the configured database instance."""
        if cls._database is None:
            client = cls.get_client()
            db_name = os.getenv("MONGODB_DATABASE", "digitalsherpa")
            cls._database = client[db_name]
        return cls._database
    
    @classmethod
    def get_collection(cls, collection_name: str):
        """Returns a specific collection from the database."""
        db = cls.get_database()
        return db[collection_name]
    
    @classmethod
    def close_connection(cls):
        """Closes the MongoDB connection."""
        if cls._client is not None:
            cls._client.close()
            cls._client = None
            cls._database = None
            print("MongoDB connection closed.")


# Convenience functions for quick access
def get_places_collection():
    """Returns the 'places' collection."""
    return MongoDBConfig.get_collection("places")


def get_database():
    """Returns the database instance."""
    return MongoDBConfig.get_database()


# Test connection when module is run directly
if __name__ == "__main__":
    try:
        db = get_database()
        print(f"Connected to database: {db.name}")
        print(f"Collections: {db.list_collection_names()}")
    except Exception as e:
        print(f"Connection test failed: {e}")
