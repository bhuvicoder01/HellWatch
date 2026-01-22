import requests
import os
from datetime import datetime

# Get the URL of your web service from an environment variable
SERVICE_URL = os.environ.get("RENDER_SERVICE_URL")

if SERVICE_URL:
    try:
        response = requests.get(SERVICE_URL, timeout=10)
        if response.status_code == 200:
            print(f"✅ Ping successful at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}. Status code: {response.status_code}")
        else:
            print(f"⚠️ Ping failed: Status code {response.status_code}")
    except requests.exceptions.Timeout:
        print(f"❌ Ping error: Request timed out")
    except requests.exceptions.RequestException as e:
        print(f"❌ Ping error: {e}")
else:
    print("❌ Error: RENDER_SERVICE_URL environment variable not set.")

