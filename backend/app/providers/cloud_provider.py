import logging
import os
import json
import httpx
from typing import AsyncGenerator, Dict, Any, List
from app.providers.base import BaseLLMProvider
from app.config import get_settings

logger = logging.getLogger("lenny_assistant.cloud")
settings = get_settings()

class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key if api_key is not None else settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_MODEL

    async def check_health(self) -> Dict[str, Any]:
        if not self.api_key or self.api_key.startswith("your_"):
            return {
                "status": "unconfigured",
                "message": "OPENAI_API_KEY is not configured.",
                "configured_model": self.model
            }
        return {
            "status": "ready",
            "provider": "OpenAI",
            "model": self.model
        }

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        temperature: float = 0.3
    ) -> AsyncGenerator[str, None]:
        if not self.api_key or self.api_key.startswith("your_"):
            yield (
                "> 💡 **OpenAI Notice:** OPENAI_API_KEY is not configured in `.env`.\n"
                "Please add `OPENAI_API_KEY=sk-...` to enable live cloud streaming.\n\n"
            )
            return

        payload_messages = [{"role": "system", "content": system_prompt}] + [
            {"role": m["role"], "content": m["content"]}
            for m in messages
            if m["role"] in ["user", "assistant"]
        ]

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        body = {
            "model": self.model,
            "messages": payload_messages,
            "stream": True,
            "temperature": temperature
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=body
                ) as response:
                    if response.status_code != 200:
                        err_content = await response.aread()
                        err_str = err_content.decode('utf-8', 'ignore')
                        logger.error(f"OpenAI API error ({response.status_code}): {err_str}")
                        if "insufficient_quota" in err_str or "credit" in err_str.lower():
                            yield (
                                f"\n\n> ⚠️ **OpenAI Credit Balance Notice:**\n"
                                f"> Your OpenAI account currently has no remaining credits (code: `credit_balance_exhausted`).\n"
                                f"> You can add credits at [platform.openai.com/billing](https://platform.openai.com/settings/organization/billing/), "
                                f"or toggle to **Local Ollama** in the top-bar for 100% free offline execution!\n\n"
                            )
                        else:
                            yield f"\n⚠️ **OpenAI API Error ({response.status_code}):** {err_str}\n"
                        return

                    async for line in response.aiter_lines():
                        line = line.strip()
                        if not line:
                            continue
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                chunk = json.loads(data_str)
                                delta = chunk.get("choices", [{}])[0].get("delta", {})
                                token = delta.get("content", "")
                                if token:
                                    yield token
                            except Exception:
                                continue

        except Exception as e:
            logger.exception("Error streaming from OpenAI")
            yield f"\n⚠️ **OpenAI Streaming Error:** {str(e)}"


class ClaudeProvider(BaseLLMProvider):
    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key if api_key is not None else settings.ANTHROPIC_API_KEY
        self.model = model or settings.ANTHROPIC_MODEL

    async def check_health(self) -> Dict[str, Any]:
        if not self.api_key or self.api_key.startswith("your_"):
            return {
                "status": "unconfigured",
                "message": "ANTHROPIC_API_KEY is not configured.",
                "configured_model": self.model
            }
        return {
            "status": "ready",
            "provider": "Anthropic Claude",
            "model": self.model
        }

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        temperature: float = 0.3
    ) -> AsyncGenerator[str, None]:
        if not self.api_key or self.api_key.startswith("your_"):
            yield (
                "> 💡 **Cloud Provider Notice:** Anthropic API key is not currently set in `.env`.\n\n"
                "Please configure `ANTHROPIC_API_KEY=sk-ant-...` in `.env` to enable live Claude 3.5 streaming, "
                "or toggle to **OpenAI / Local Ollama** in the top-bar model switcher.\n\n"
            )
            return

        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=self.api_key)

            formatted_messages = [
                {"role": m["role"], "content": m["content"]}
                for m in messages
                if m["role"] in ["user", "assistant"]
            ]

            async with client.messages.stream(
                model=self.model,
                max_tokens=2500,
                system=system_prompt,
                messages=formatted_messages
            ) as stream:
                async for text in stream.text_stream:
                    yield text

        except Exception as e:
            err_str = str(e)
            logger.error(f"Claude API generation error: {err_str}")
            if "credit balance is too low" in err_str or "credit" in err_str.lower():
                yield (
                    f"\n\n> ⚠️ **Anthropic Credit Balance Notice:**\n"
                    f"> Your Anthropic account currently has a zero credit balance. "
                    f"Please switch to **OpenAI** or **Local Ollama** in the top-bar model toggle!\n\n"
                )
            else:
                yield f"\n⚠️ **Cloud Provider Error:** {err_str}"


def resolve_cloud_provider(provider_hint: str = None) -> BaseLLMProvider:
    if provider_hint == "openai":
        return OpenAIProvider()
    if provider_hint == "claude":
        return ClaudeProvider()
    # Default auto-selection
    if settings.OPENAI_API_KEY and not settings.OPENAI_API_KEY.startswith("your_"):
        return OpenAIProvider()
    return ClaudeProvider()
