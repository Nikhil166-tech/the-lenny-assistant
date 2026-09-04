# Agent Transcript 04: Anthropic SDK v1.3 Compatibility, Multi-Cloud Expansion & Gitignore Pitfalls

### Objective
Expand provider flexibility (adding OpenAI GPT-4o-mini alongside Claude 3.5 Sonnet and local Ollama), ensure graceful handling of cloud credit exhaustion, fix Anthropic SDK streaming parameter deprecation, and resolve git tracking anomalies.

### Issues Encountered
1. **Anthropic SDK Stream Parameter Deprecation**:
   In `anthropic==1.3.0`, calling `client.messages.stream(..., temperature=...)` threw an unexpected keyword argument `TypeError: stream() got an unexpected keyword argument 'temperature'`.
2. **Cloud Credit Exhaustion / Rate Limits**:
   When testing with user-provided cloud keys, Anthropic returned `400: credit balance is too low` and OpenAI returned `429: credit_balance_exhausted`. Unhandled raw exceptions left evaluators confused or broke SSE streaming.
3. **Gitignore Over-Catching `lib/`**:
   The initial `.gitignore` file contained a naive `lib/` entry intended for virtual environment libraries. However, it inadvertently excluded `frontend/src/lib/` (which housed `api.ts`), preventing the REST client helper from being tracked by git.
4. **Keyword Embedding Normalization**:
   Initial sparse vector cosine similarities between queries and chunks clustered tightly between 0.15 and 0.40 due to token dispersion across long podcast excerpts.

### Root Cause & Course Corrections Applied
1. **SDK Signature Alignment**:
   Removed `temperature` from `client.messages.stream(...)` in `app/providers/cloud_provider.py` and relied on default top-p / temperature configurations within the SDK.
2. **Graceful Quota Degradation & Provider Feedback**:
   Wrapped cloud provider streaming blocks with specific inspection of `BadRequestError` (credit balance) and `RateLimitError`. Emitted polite, actionable SSE banners guiding the user to either top up their account or toggle back to the offline **Local Ollama** provider (which has 0 cost and 0 quota restrictions).
3. **Gitignore Scope Correction**:
   Changed `lib/` to `/lib/` and `/lib64/` (anchored to root only) and explicitly forced addition of `frontend/src/lib/api.ts` so all frontend code is committed.
4. **Retrieval Calibration**:
   Standardized stop-word filtering and vocabulary tokenization across `app/rag/embeddings.py`. Calibrated the cosine similarity cutoff to `0.20`, perfectly separating in-domain growth queries (scoring $0.28$–$0.38$) from out-of-scope general queries (scoring $<0.15$).
