import requests
import json

url = "http://127.0.0.1:8000/search"
payload = {
    "query": "historic temple",
    "top_k": 5
}
headers = {'Content-Type': 'application/json'}

try:
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
