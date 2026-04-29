import asyncio
import httpx

async def main():
    base = "http://127.0.0.1:8000/api"
    email = "testuser+dev@example.com"
    pwd = "TestPass123"

    async with httpx.AsyncClient() as client:
        # Register (may fail if user exists)
        try:
            reg = await client.post(f"{base}/auth/register", json={
                "email": email,
                "full_name": "Dev Tester",
                "password": pwd,
                "phone": "+15551234567"
            }, timeout=10)
            print('register status:', reg.status_code)
            print(reg.text)
        except Exception as e:
            print('register error:', e)

        # Login
        try:
            login = await client.post(f"{base}/auth/login", data={"username": email, "password": pwd}, timeout=10)
            print('login status:', login.status_code)
            print(login.text)
        except Exception as e:
            print('login error:', e)
            return

        if login.status_code != 200:
            print('Login failed; aborting test notification')
            return

        token = login.json().get('access_token')
        headers = {"Authorization": f"Bearer {token}"}

        # Send test notification
        try:
            test = await client.post(f"{base}/notifications/test", params={"email": email, "phone": "+15551234567"}, headers=headers, timeout=10)
            print('test notification status:', test.status_code)
            print(test.text)
        except Exception as e:
            print('test notification error:', e)

        # Get notifications
        try:
            getn = await client.get(f"{base}/notifications/", headers=headers, timeout=10)
            print('get notifications status:', getn.status_code)
            print(getn.text)
        except Exception as e:
            print('get notifications error:', e)

if __name__ == '__main__':
    asyncio.run(main())
