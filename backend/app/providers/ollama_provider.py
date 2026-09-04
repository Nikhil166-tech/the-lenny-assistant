import httpx
import json
import logging
from typing import AsyncGenerator, Dict, Any, List
from app.providers.base import BaseLLMProvider
from app.config import get_settings

logger = logging.getLogger("lenny_assistant.ollama")
settings = get_settings()

class OllamaProvider(BaseLLMProvider):
    def __init__(
        self,
        base_url: str = None,
        model: str = None,
        timeout: float = None
    ):
        self.base_url = base_url or settings.OLLAMA_BASE_URL
        self.model = model or settings.OLLAMA_MODEL
        self.timeout = timeout or settings.OLLAMA_TIMEOUT_SECONDS

    async def check_health(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    models = [m.get("name") for m in resp.json().get("models", [])]
                    return {
                        "status": "online",
                        "available_models": models,
                        "configured_model": self.model,
                        "model_ready": any(self.model in m for m in models)
                    }
        except Exception as e:
            return {
                "status": "offline",
                "error": str(e),
                "configured_model": self.model
            }
        return {"status": "unhealthy"}

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        temperature: float = 0.3
    ) -> AsyncGenerator[str, None]:
        formatted_messages = [{"role": "system", "content": system_prompt}] + messages
        payload = {
            "model": self.model,
            "messages": formatted_messages,
            "stream": True,
            "options": {
                "temperature": temperature,
                "top_p": 0.9
            }
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream("POST", f"{self.base_url}/api/chat", json=payload) as response:
                    if response.status_code != 200:
                        err_text = await response.aread()
                        logger.error(f"Ollama error {response.status_code}: {err_text.decode('utf-8', 'ignore')}")
                        yield f"Error from Ollama ({response.status_code}): Ensure model '{self.model}' is installed via `ollama run {self.model}`."
                        return

                    async for line in response.aiter_lines():
                        if line:
                            try:
                                chunk = json.loads(line)
                                content = chunk.get("message", {}).get("content", "")
                                if content:
                                    yield content
                            except Exception:
                                continue

        except (httpx.ConnectError, httpx.TimeoutException) as conn_err:
            logger.warning(f"Ollama connection issue: {conn_err}")
            yield (
                f"\n\n> ⚠️ **Local Ollama Notice:** Cannot reach Ollama at `{self.base_url}`.\n"
                f"> To run the local model demo, please ensure Ollama is started (`ollama serve`) "
                f"and `{self.model}` is downloaded (`ollama pull {self.model}`).\n\n"
            )
            # Yield helpful synthesis using retrieved transcript context directly
            context_summary = "\n".join([m.get("content", "") for m in messages if m.get("role") == "user"])
            yield f"*(Simulated fallback for offline local testing based on retrieved transcript wisdom for: '{context_summary}')*"
