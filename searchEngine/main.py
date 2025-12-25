from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
from search_service import SearchService

app = FastAPI(title="DigitalSherpa Global Search API")

# Configuration
# Adjust paths as per your environment or use environment variables
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
FAISS_INDEX_FILE = os.path.join(DATA_DIR, 'places.faiss')
METADATA_FILE = os.path.join(DATA_DIR, 'metadata.json')

# Initialize Search Service
try:
    search_service = SearchService(FAISS_INDEX_FILE, METADATA_FILE)
except Exception as e:
    print(f"Failed to initialize SearchService: {e}")
    search_service = None

class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 50

class SearchResult(BaseModel):
    place_id: str
    score: float
    category: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

@app.get("/")
def read_root():
    return {"message": "Welcome to DigitalSherpa Search API"}

@app.post("/search", response_model=List[SearchResult])
def search_places(request: SearchRequest):
    if not search_service:
        raise HTTPException(status_code=500, detail="Search service is not initialized.")
    
    try:
        results = search_service.search(request.query, top_k=request.top_k)
        
        # Transform to response model
        response_data = []
        for res in results:
            meta = res.get("metadata", {})
            response_data.append(SearchResult(
                place_id=res.get("place_id"),
                score=res.get("score"),
                category=meta.get("category"),
                lat=meta.get("lat"),
                lon=meta.get("lon")
            ))
            
        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
