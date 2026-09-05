import asyncio
import re
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
                "temperature": 0.2,
                "top_p": 0.9,
                "num_ctx": 2048,
                "num_predict": 450
            }
        }

        try:
            timeout_cfg = httpx.Timeout(connect=10.0, read=self.timeout, write=10.0, pool=10.0)
            async with httpx.AsyncClient(timeout=timeout_cfg) as client:
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
            notice = (
                f"> ⚠️ **Local Ollama Notice:** Cannot reach Ollama at `{self.base_url}`.\n"
                f"> *Running in Offline Fallback Mode. To enable local neural model streaming, start Ollama (`ollama serve`) "
                f"and run `ollama pull {self.model}`. You can also select **Claude 3.5** or **OpenAI** in the top model dropdown.*\n\n"
                f"---\n\n"
            )
            for chunk in self._chunk_tokens(notice):
                yield chunk
                await asyncio.sleep(0.01)

            # Generate structured synthesis from retrieved context in prompt
            raw_prompt = "\n".join([m.get("content", "") for m in messages if m.get("role") == "user"])
            synthesis = self._synthesize_offline_context(raw_prompt)
            for chunk in self._chunk_tokens(synthesis):
                yield chunk
                await asyncio.sleep(0.015)

    def _chunk_tokens(self, text: str, chunk_size: int = 4) -> List[str]:
        words = text.split(" ")
        chunks = []
        for i in range(0, len(words), chunk_size):
            chunks.append(" ".join(words[i:i + chunk_size]) + " ")
        return chunks

    def _synthesize_offline_context(self, prompt: str) -> str:
        question_match = re.search(r"User (?:Question|Prompt):\s*(.*?)(?=\n\nCompose|\Z)", prompt, re.DOTALL)
        question = question_match.group(1).strip() if question_match else "your question"

        pattern = r"---\s*(?:SOURCE CHUNK:\s*)?Episode:?\s*['\"]?(.*?)['\"]?\s*---\n([\s\S]*?)(?=(?:---\s*(?:SOURCE CHUNK:\s*)?Episode:|$|User (?:Question|Prompt):))"
        matches = re.findall(pattern, prompt)

        if not matches:
            return (
                f"### Grounded Response\n\n"
                f"Based on Lenny's Podcast archives, we were unable to retrieve sufficient detail regarding: **{question}**."
            )

        out = [
            f"### Grounded Synthesis from Lenny's Podcast Transcripts\n\n",
            f"Here is the wisdom directly from Lenny's podcast archives addressing **{question}**:\n\n"
        ]

        for ep_header, text in matches:
            meta_match = re.search(r"^(.*?)\s*\((?:Guest:\s*(.*?)\s*-\s*(.*?))\)\s*\[(.*?)\]", ep_header)
            if meta_match:
                ep_title = meta_match.group(1).strip()
                guest = meta_match.group(2).strip()
                topic = meta_match.group(3).strip()
                timestamp = meta_match.group(4).strip()
            else:
                ep_title = ep_header.strip()
                guest = "Guest Expert"
                topic = "Strategy"
                timestamp = "00:00:00"

            out.append(f"#### 🎙️ **{guest}** — *{topic}*\n")
            out.append(f"> **Citation:** *[{ep_title} ({timestamp})]*\n\n")

            lines = [l.strip() for l in text.strip().split("\n") if l.strip()]
            for line in lines:
                if line.startswith("Lenny:"):
                    out.append(f"\n**{line}**\n\n")
                elif ":" in line and not line.startswith("http"):
                    speaker, rest = line.split(":", 1)
                    out.append(f"**{speaker.strip()}:**\n{rest.strip()}\n\n")
                else:
                    out.append(f"{line}\n\n")

            out.append("---\n\n")

        out.append(
            "\n💡 *Tip: Great product managers allocate their highest-leverage cognitive energy toward "
            "the top 10% of high-impact strategic decisions, while ruthlessly containing overhead.*"
        )
        return "".join(out)
