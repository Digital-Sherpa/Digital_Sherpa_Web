from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from search_service import SearchService

# Load environment variables
load_dotenv()

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
FAISS_INDEX_FILE = os.path.join(DATA_DIR, 'places.faiss')
METADATA_FILE = os.path.join(DATA_DIR, 'metadata.json')

# Global search service instance
search_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown events."""
    global search_service
    
    # Startup
    try:
        # Check if MongoDB is configured
        use_mongodb = bool(os.getenv("MONGODB_URI"))
        
        search_service = SearchService(
            FAISS_INDEX_FILE, 
            METADATA_FILE,
            use_mongodb=use_mongodb
        )
        print("✅ Search service initialized successfully!")
        
        if use_mongodb:
            print("📦 MongoDB integration enabled")
        else:
            print("⚠️  MongoDB not configured - using local metadata only")
            print("   Set MONGODB_URI in .env to enable MongoDB features")
            
    except Exception as e:
        print(f"❌ Failed to initialize SearchService: {e}")
        search_service = None
    
    yield
    
    # Shutdown - cleanup if needed
    print("Shutting down search service...")


app = FastAPI(
    title="DigitalSherpa Global Search API",
    description="Semantic search API for places with MongoDB integration",
    version="2.0.0",
    lifespan=lifespan
)

# Add CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Request/Response Models ==============

class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 50
    include_details: Optional[bool] = False  # New: fetch full MongoDB details


class SearchResult(BaseModel):
    place_id: str
    score: float
    category: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


class SearchResultWithDetails(SearchResult):
    """Extended search result with full place details from MongoDB."""
    full_details: Optional[Dict[str, Any]] = None


class PlaceDetails(BaseModel):
    """Full place details model."""
    id: str
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    coordinates: Optional[Dict[str, float]] = None
    imageUrl: Optional[str] = None
    gallery: Optional[List[str]] = None
    videos: Optional[List[Dict[str, Any]]] = None
    address: Optional[str] = None
    openingHours: Optional[str] = None
    entryFee: Optional[Dict[str, int]] = None
    tags: Optional[List[str]] = None
    hasWorkshop: Optional[bool] = None
    isSponsored: Optional[bool] = None


class HealthResponse(BaseModel):
    status: str
    mongodb_connected: bool
    faiss_index_loaded: bool
    total_vectors: Optional[int] = None


# ============== API Endpoints ==============

@app.get("/")
def read_root():
    """Welcome endpoint."""
    return {
        "message": "Welcome to DigitalSherpa Search API v2.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint with service status."""
    if not search_service:
        return HealthResponse(
            status="unhealthy",
            mongodb_connected=False,
            faiss_index_loaded=False
        )
    
    return HealthResponse(
        status="healthy",
        mongodb_connected=search_service.use_mongodb,
        faiss_index_loaded=search_service.index is not None,
        total_vectors=search_service.index.ntotal if search_service.index else None
    )


@app.post("/search", response_model=List[SearchResult])
def search_places(request: SearchRequest):
    """
    Basic semantic search for places.
    Returns matching places with scores and basic metadata.
    """
    if not search_service:
        raise HTTPException(status_code=500, detail="Search service is not initialized.")
    
    try:
        results = search_service.search(
            request.query, 
            top_k=request.top_k,
            include_full_details=False
        )
        
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


@app.post("/search/detailed", response_model=List[SearchResultWithDetails])
def search_places_with_details(request: SearchRequest):
    """
    Semantic search with full place details from MongoDB.
    Requires MongoDB to be configured for full details.
    """
    if not search_service:
        raise HTTPException(status_code=500, detail="Search service is not initialized.")
    
    try:
        results = search_service.search(
            request.query, 
            top_k=request.top_k,
            include_full_details=True
        )
        
        response_data = []
        for res in results:
            meta = res.get("metadata", {})
            response_data.append(SearchResultWithDetails(
                place_id=res.get("place_id"),
                score=res.get("score"),
                category=meta.get("category"),
                lat=meta.get("lat"),
                lon=meta.get("lon"),
                full_details=res.get("full_details")
            ))
            
        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/places/{place_id}", response_model=PlaceDetails)
def get_place_by_id(place_id: str):
    """
    Fetch full place details by ID from MongoDB.
    """
    if not search_service:
        raise HTTPException(status_code=500, detail="Search service is not initialized.")
    
    if not search_service.use_mongodb:
        raise HTTPException(
            status_code=503, 
            detail="MongoDB is not configured. Set MONGODB_URI in .env file."
        )
    
    try:
        place = search_service.get_place_details(place_id)
        
        if not place:
            raise HTTPException(status_code=404, detail="Place not found")
        
        return PlaceDetails(
            id=place.get("_id"),
            name=place.get("name"),
            slug=place.get("slug"),
            description=place.get("description"),
            category=place.get("category"),
            subcategory=place.get("subcategory"),
            coordinates=place.get("coordinates"),
            imageUrl=place.get("imageUrl"),
            gallery=place.get("gallery"),
            videos=place.get("videos"),
            address=place.get("address"),
            openingHours=place.get("openingHours"),
            entryFee=place.get("entryFee"),
            tags=place.get("tags"),
            hasWorkshop=place.get("hasWorkshop"),
            isSponsored=place.get("isSponsored")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/places")
def get_all_places(
    limit: int = Query(default=50, ge=1, le=200),
    skip: int = Query(default=0, ge=0),
    category: Optional[str] = None
):
    """
    List all places from MongoDB with pagination.
    """
    if not search_service or not search_service.use_mongodb:
        raise HTTPException(
            status_code=503, 
            detail="MongoDB is not configured. Set MONGODB_URI in .env file."
        )
    
    try:
        from mongodb_service import PlaceService
        place_service = PlaceService()
        
        if category:
            places = place_service.search_places_by_category(category)
        else:
            places = place_service.get_all_places(limit=limit, skip=skip)
        
        return {
            "count": len(places),
            "limit": limit,
            "skip": skip,
            "places": places
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

