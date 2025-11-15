import requests

# Token uzyskany z logowania
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJyb2xlcyI6WyJwYXJ0aWNpcGFudCJdLCJleHAiOjE3NjMxODQwNDl9.zsIi8Y4BaGQAJ3boCsAHULGcm4zUeRSrBjhiZ1_IX58"

url = "http://127.0.0.1:5000/participant/upload"

files = {
    "file": open("example.py", "rb")  # przykładowy plik do uploadu
}

headers = {
    "Authorization": token
}

response = requests.post(url, files=files, headers=headers)
print("Status code:", response.status_code)
print("Response:", response.json())
