import requests

url = "http://127.0.0.1:5000/login"
data = {
    "email": "test@example.com",
    "password": "testpassword"
}

response = requests.post(url, json=data)
print("Status code:", response.status_code)
print("Response:", response.json())

# Jeśli status 200 i w response jest 'token', logowanie działa
token = response.json().get("token")
