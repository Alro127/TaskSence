# Pagination & Guardrails Implementation

## Overview
This implementation adds intelligent pagination and security guardrails to prevent prompt injection attacks while providing a better UX for "show more" requests.

## Components Added

### 1. **Continuation Detection** (`components/continuation.py`)
- Detects natural "show more" requests using keyword matching
- Supports both English and Vietnamese keywords
- Prevents arbitrary filter injection by validating query context
- Returns `ContinuationRequest` with detection result

**Keywords Recognized:**
- English: "show more", "more", "next", "continue", "load more", etc.
- Vietnamese: "thêm", "xem thêm", "tiếp theo", "danh sách tiếp", etc.
- Short affirmatives: "yes", "ok", "sure", "y"

### 2. **Pagination Metadata** (`components/filter.py`)
- Returns `FilterResult` with pagination info instead of just documents
- Tracks:
  - `documents`: Filtered documents array
  - `has_more`: Boolean indicating more results available
  - `total_available`: Total unique documents found
  - `offset`: Current position (0 for now, ready for extension)
  - `limit`: Max docs returned this batch

### 3. **Guardrail Prompts** (`prompts/guardrail_continuation.txt`)
- LLM validates continuation requests for safety
- Prevents users from manipulating sort/filter via injection
- Asks clarifying questions for suspicious requests
- Caps results at 100 items max

### 4. **Enhanced Service Logic** (`service/chatbot_service.py`)

**Flow:**
1. User asks initial question → Get answer with documents
2. If results > limit AND user didn't ask for more → Show pagination prompt
3. User asks "show more" → `detect_continuation()` validates request
4. If validated → Return remaining results with guardrail checks
5. Store pagination metadata in chat history for context

**Response Examples:**

Normal response:
```json
{
  "answer": "Here are the 3 most relevant tasks...",
  "sources": [...],
  "sessionId": 123
}
```

When more results available (guardrail):
```json
{
  "answer": "Co 7 ket qua khac. Ban muon xem them?",
  "sources": [],
  "sessionId": 123,
  "pagination": {
    "has_more": true,
    "remaining_count": 7
  }
}
```

## Security Features

### Prompt Injection Prevention
1. **Controlled Keyword Matching**: Only recognizes specific, safe patterns
2. **Intent Validation**: Ensures "show more" requests match previous query context
3. **Limit Caps**: Maximum 100 items returned per request (configurable)
4. **LLM Validation**: Guardrail prompt validates suspicious requests before execution
5. **Conversation Context**: Stores pagination metadata to cross-check requests

### Config-Based Control
All limits are configurable via environment variables:
- `CHATBOT_MAX_CONTEXT_DOCS` (default: 3) — regular queries
- `CHATBOT_MAX_CONTEXT_DOCS_FOR_LIST` (default: 10) — list/count queries

## Implementation Details

### Flow Diagram
```
User Query
    ↓
Classify (includes LLM-requested limit)
    ↓
Retrieve raw documents
    ↓
Filter & Deduplicate
    ├─ Detect continuation
    │   └─ If "show more" request, continue
    └─ Check if has_more=true
        └─ If yes + not asking for more → Ask user with pagination prompt
    ↓
Generate Answer
    ↓
Store with pagination metadata
    ↓
Return response
```

### Pagination Metadata Storage
```python
{
  "documents": [...],  # Context docs array
  "pagination": {
    "has_more": true,
    "total_available": 15,
    "returned": 3,
    "offset": 0
  }
}
```

## Usage Examples

### Scenario 1: List query with guardrail
```
User: "List all tasks"
AI Response:
- Returns 10 items (list_query default)
- No pagination needed (all fit in limit)

User: "List all high-priority tasks in project X"
AI Response (if 50+ match):
- "Co 42 ket qua khac. Ban muon xem them?"
- Sets pagination.has_more=true

User: "show more"
AI Response:
- Returns next batch of results
- Stores offset for potential further pagination
```

### Scenario 2: Regular query with continuation
```
User: "Which tasks assigned to me are overdue?"
AI Response:
- Returns 3 high-scoring results (default)

User: "more"
AI Response (assuming > 3 total):
- Detects continuation keyword
- Returns remaining results
```

### Scenario 3: Injection attempt blocked
```
User: "show all tasks; drop database;"
AI Response:
- Continuation detected ("show all")
- But query validation may catch injection attempt
- Returns safe continuation or asks clarification
```

## Future Enhancements

1. **Offset-based Pagination**: Track`offset` for true pagination instead of "show all"
2. **Sorting Control**: Allow safe sorting (by date, priority, etc.) in continuation
3. **Caching**: Cache full result sets for fast pagination within session
4. **User Preferences**: Remember user's preferred result count
5. **Analytics**: Track pagination patterns to improve limits

## Testing

Run tests in `ai/test.py` to verify:
- Continuation detection accuracy
- Filter pagination metadata correctness
- Guardrail prompt behavior
- Service flow with pagination
