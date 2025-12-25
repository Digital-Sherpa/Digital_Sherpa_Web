"""
Script to regenerate FAISS embeddings from MongoDB data.
Run this script whenever your MongoDB data changes significantly.
"""
import json
import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import MongoDB service
from mongodb_service import PlaceService


def sync_embeddings_from_mongodb(output_dir: str = None):
    """
    Fetches all places from MongoDB and regenerates FAISS index and metadata.
    
    Args:
        output_dir: Directory to save the index and metadata files.
                   Defaults to ./data directory.
    """
    if output_dir is None:
        output_dir = os.path.join(os.path.dirname(__file__), 'data')
    
    os.makedirs(output_dir, exist_ok=True)
    
    faiss_index_file = os.path.join(output_dir, 'places.faiss')
    metadata_file = os.path.join(output_dir, 'metadata.json')
    
    print("=" * 60)
    print("🔄 Syncing Embeddings from MongoDB")
    print("=" * 60)
    
    # 1. Fetch data from MongoDB
    print("\n📦 Fetching places from MongoDB...")
    place_service = PlaceService()
    places = place_service.get_places_for_embedding()
    
    if not places:
        print("❌ No places found in MongoDB!")
        return False
    
    print(f"   Found {len(places)} places")
    
    # 2. Prepare corpus for embedding
    print("\n📝 Preparing text corpus for embedding...")
    corpus = []
    metadata_map = {}
    
    for idx, place in enumerate(places):
        # Combine fields for embedding
        name = place.get("name", "")
        description = place.get("description", "")
        tags = " ".join(place.get("tags", []))
        category = place.get("category", "")
        
        text_to_embed = f"{name} {description} {tags} {category}".strip()
        corpus.append(text_to_embed)
        
        # Store metadata
        coords = place.get("coordinates", {})
        metadata_map[idx] = {
            "place_id": place.get("_id") or place.get("id"),
            "lat": coords.get("lat"),
            "lon": coords.get("lng") or coords.get("lon"),
            "category": category
        }
    
    print(f"   Created corpus with {len(corpus)} entries")
    
    # 3. Generate embeddings
    print("\n🤖 Loading SentenceTransformer model...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    print("   Generating embeddings (this may take a moment)...")
    embeddings = model.encode(corpus, show_progress_bar=True)
    embeddings = np.array(embeddings).astype('float32')
    
    print(f"   Generated embeddings with shape: {embeddings.shape}")
    
    # 4. Create FAISS index
    print("\n📊 Creating FAISS index...")
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    
    print(f"   Created index with {index.ntotal} vectors (dimension: {dimension})")
    
    # 5. Save artifacts
    print("\n💾 Saving artifacts...")
    
    # Backup existing files
    if os.path.exists(faiss_index_file):
        backup_file = faiss_index_file + ".backup"
        os.rename(faiss_index_file, backup_file)
        print(f"   Backed up existing index to {backup_file}")
    
    if os.path.exists(metadata_file):
        backup_file = metadata_file + ".backup"
        os.rename(metadata_file, backup_file)
        print(f"   Backed up existing metadata to {backup_file}")
    
    # Save new files
    faiss.write_index(index, faiss_index_file)
    print(f"   Saved FAISS index to {faiss_index_file}")
    
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata_map, f, indent=4)
    print(f"   Saved metadata to {metadata_file}")
    
    print("\n" + "=" * 60)
    print("✅ Sync complete!")
    print(f"   Total places indexed: {len(places)}")
    print(f"   Index file: {faiss_index_file}")
    print(f"   Metadata file: {metadata_file}")
    print("=" * 60)
    
    return True


if __name__ == "__main__":
    import sys
    
    try:
        success = sync_embeddings_from_mongodb()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error during sync: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
