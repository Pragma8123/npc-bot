import base64
import os

import aiohttp
from dotenv import load_dotenv

load_dotenv()

OPENWEBUI_URL = os.environ["OPENWEBUI_URL"]
OPENWEBUI_AUTH_TOKEN = os.environ["OPENWEBUI_AUTH_TOKEN"]


async def generate_image(
    prompt: str,
) -> bytes | None:
    async with aiohttp.ClientSession() as session:
        json = {
            "prompt": prompt,
        }
        async with session.post(
            f"{OPENWEBUI_URL}/api/v1/images/generations",
            json=json,
            headers={"Authorization": f"Bearer {OPENWEBUI_AUTH_TOKEN}"},
        ) as response:
            data = await response.json()
            image_url = f"{OPENWEBUI_URL}{data[0]["url"]}"
            async with session.get(
                image_url, headers={"Authorization": f"Bearer {OPENWEBUI_AUTH_TOKEN}"}
            ) as response:
                image_bytes = await response.read()
                return image_bytes
