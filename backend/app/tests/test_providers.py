import pytest
from app.providers.ollama_provider import OllamaProvider
from app.providers.cloud_provider import ClaudeProvider

@pytest.mark.asyncio
async def test_ollama_provider_health():
    provider = OllamaProvider(base_url="http://localhost:11434")
    health = await provider.check_health()
    assert "status" in health
    assert health["configured_model"] == "llama3.2:3b"

@pytest.mark.asyncio
async def test_claude_provider_unconfigured_state():
    provider = ClaudeProvider(api_key="")
    health = await provider.check_health()
    assert health["status"] == "unconfigured"

@pytest.mark.asyncio
async def test_ollama_provider_offline_resilience():
    # Test that offline Ollama yields a clear notice rather than crashing with unhandled exception
    provider = OllamaProvider(base_url="http://127.0.0.1:59999", timeout=1.0)
    tokens = []
    async for token in provider.generate_response(
        messages=[{"role": "user", "content": "Hello"}],
        system_prompt="You are an assistant."
    ):
        tokens.append(token)
    full_output = "".join(tokens)
    assert "Local Ollama Notice" in full_output or "offline" in full_output.lower()
