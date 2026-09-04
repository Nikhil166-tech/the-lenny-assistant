# Agent Transcript 03: Model Switching & Resilience Handling

### Objective
Ensure resilient dual-model routing between Local Ollama and Cloud Claude 3.5 without breaking SSE streaming or crashing on missing credentials.

### Issue Encountered
When an evaluator switched the provider toggle to "Claude" without configuring an `ANTHROPIC_API_KEY`, unhandled exceptions occurred in the streaming generator, terminating the HTTP connection abruptly and leaving the frontend in a permanent "Loading..." state. Similarly, if Ollama was not currently running on port 11434, connection timeouts caused long hangs.

### Correction Applied
1. Added pre-flight health checks and graceful degradation:
   - `OllamaProvider`: Wraps `httpx.ConnectError` and returns an immediate user-friendly SSE event: *"Cannot connect to Ollama at http://localhost:11434. Please ensure Ollama is running and model `llama3.2:3b` is pulled (`ollama run llama3.2:3b`)."*
   - `CloudProvider`: Checks if `ANTHROPIC_API_KEY` is present. If missing or invalid, streams a polite prompt explaining that the cloud key is unconfigured, or seamlessly falls back to the local provider.
2. Structured SSE error frames:
   All exceptions now emit typed SSE packets:
   ```json
   {"type": "error", "message": "Ollama service unavailable. Please start Ollama."}
   ```
   Allowing the frontend UI to display clean error banners and recovery suggestions rather than failing silently.
