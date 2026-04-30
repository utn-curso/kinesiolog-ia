"""Test the actual HTTP login endpoint"""
import urllib.request
import urllib.parse
import urllib.error
import json

url = "http://localhost:8000/api/auth/login"
data = urllib.parse.urlencode({
    "username": "doctor@gmail.com",
    "password": "password123"
}).encode("utf-8")

req = urllib.request.Request(url, data=data, headers={
    "Content-Type": "application/x-www-form-urlencoded"
})

try:
    with urllib.request.urlopen(req) as response:
        body = json.loads(response.read().decode())
        print(f"STATUS: {response.status}")
        print(f"TOKEN: {body.get('access_token', 'N/A')[:50]}...")
        print("LOGIN OK!")
except urllib.error.HTTPError as e:
    print(f"HTTP ERROR: {e.code}")
    print(e.read().decode())
except Exception as e:
    print(f"ERROR: {e}")
