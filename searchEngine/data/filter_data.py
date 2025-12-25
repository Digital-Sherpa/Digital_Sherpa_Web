import json
import os

def filter_json_data(input_file, output_file):
    """
    Filters the input JSON data to include only specific fields.
    """
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found.")
        return

    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if not isinstance(data, list):
            print("Error: Input data is not a list of objects.")
            return

        filtered_data = []
        for item in data:
            # Extracting id from _id.$oid if it exists, else just id
            item_id = ""
            if "_id" in item and isinstance(item["_id"], dict) and "$oid" in item["_id"]:
                item_id = item["_id"]["$oid"]
            elif "id" in item:
                item_id = item["id"]

            filtered_item = {
                "id": item_id,
                "name": item.get("name", ""),
                "slug": item.get("slug", ""),
                "description": item.get("description", ""),
                "category": item.get("category", ""),
                "subcategory": item.get("subcategory", ""),
                "address": item.get("address", ""),
                "tags": item.get("tags", []),
                "coordinates": item.get("coordinates", {})
            }
            filtered_data.append(filtered_item)

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(filtered_data, f, indent=4)

        print(f"Successfully created {output_file} with {len(filtered_data)} entries.")

    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    INPUT_PATH = "f:/DigitalSherpaLLM/data/Data.json"
    OUTPUT_PATH = "f:/DigitalSherpaLLM/data/FilteredData.json"
    filter_json_data(INPUT_PATH, OUTPUT_PATH)
