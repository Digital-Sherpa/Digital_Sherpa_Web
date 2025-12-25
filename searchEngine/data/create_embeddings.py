import json
import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

def create_embeddings(input_file, faiss_index_file, metadata_file):
    """
    Generates embeddings for the input data and stores them in a FAISS index.
    """
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found.")
        return

    try:
        # 1. Load Data
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if not data:
            print("No data found in input file.")
            return

        print(f"Loaded {len(data)} items from {input_file}")

        # 2. Prepare Corpus for Embedding
        corpus = []
        metadata_map = {}
        
        for idx, item in enumerate(data):
            # Combine fields: description + tags + category
            # Ensure all parts are strings and handle missing values
            description = item.get("description", "")
            tags = " ".join(item.get("tags", []))
            category = item.get("category", "")
            
            text_to_embed = f"{description} {tags} {category}".strip()
            corpus.append(text_to_embed)
            
            # Store metadata
            metadata_map[idx] = {
                "place_id": item.get("id"),
                "lat": item.get("coordinates", {}).get("lat"),
                "lon": item.get("coordinates", {}).get("lng"), # Note: 'lng' in source, mapped to 'lon'
                "category": category
            }

        # 3. Generate Embeddings
        print("Loading SentenceTransformer model...")
        model = SentenceTransformer('all-MiniLM-L6-v2') 
        
        print(f"Generating embeddings for {len(corpus)} items...")
        embeddings = model.encode(corpus)
        
        # Convert to float32 for FAISS
        embeddings = np.array(embeddings).astype('float32')
        
        # 4. Create and Populate FAISS Index
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatL2(dimension)
        index.add(embeddings)
        
        print(f"Created FAISS index with {index.ntotal} vectors.")

        # 5. Save Artifacts
        faiss.write_index(index, faiss_index_file)
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata_map, f, indent=4)

        print(f"Saved FAISS index to {faiss_index_file}")
        print(f"Saved metadata to {metadata_file}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    INPUT_FILE = "f:/DigitalSherpaLLM/data/FilteredData.json"
    FAISS_INDEX_FILE = "f:/DigitalSherpaLLM/data/places.faiss"
    METADATA_FILE = "f:/DigitalSherpaLLM/data/metadata.json"
    
    create_embeddings(INPUT_FILE, FAISS_INDEX_FILE, METADATA_FILE)
