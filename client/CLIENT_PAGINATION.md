# Client Pagination & Guardrails Update

## Summary
The client has been updated to render the new pagination response format and provide a "Show More" button when additional results are available beyond the initial limit.

## Files Updated

### 1. **API Types** (`client/src/types/api.ts`)
Added pagination metadata type:
```typescript
export interface PaginationMetadata {
  has_more: boolean;
  remaining_count?: number;
}
```

Updated `AIAgentResponse`:
```typescript
export interface AIAgentResponse {
  answer: string;
  sources: AIAgentSource[];
  sessionId: number | null;
  pagination?: PaginationMetadata;  // NEW
}
```

### 2. **Component Types** (`client/src/features/agent/components/types.ts`)
Updated `ChatMessage` to include pagination:
```typescript
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: AIAgentSource[];
  pagination?: PaginationMetadata;  // NEW
}
```

### 3. **Chat Conversation Component** (`ChatConversation.tsx`)
**New Props:**
- `onShowMore: (messageIndex: number) => void` — Handler for "Show More" button

**New Features:**
- Renders pagination button when `message.pagination?.has_more` is true
- Shows remaining count: "Show X more"
- Button is disabled during loading
- Uses ChevronDown icon from lucide-react
- Buttons styled consistently with brand colors

**Button Example:**
```tsx
{message.role === "assistant" && message.pagination?.has_more && (
  <div className="mt-3 flex gap-2">
    <button
      onClick={() => onShowMore(index)}
      disabled={isSendLoading}
      className="flex items-center gap-1 rounded-lg bg-[#233a87] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1a2d6b] disabled:opacity-50"
    >
      <ChevronDown className="h-3.5 w-3.5" />
      Show {message.pagination.remaining_count} more
    </button>
  </div>
)}
```

### 4. **Agent Chat Page** (`AgentChatPage.tsx`)
**New Handler:**
```typescript
const handleShowMore = async (messageIndex: number) => {
  // User clicked "Show More"
  // Send continuation query ("show more") to backend
  // Backend will detect continuation and return next batch
}
```

**Enhanced Message Parsing:**
- Extracts pagination metadata from `context.pagination`
- Handles both old format (`sources` array) and new format (`context.documents`)
- Supports backward compatibility

**Updated Component:**
- Pass `onShowMore={handleShowMore}` to ChatConversation
- Handles loading state during continuation

## User Experience Flow

### Scenario: User asks for list of tasks
1. **User:** "List all high-priority tasks"
2. **Backend:** Returns 3 items (limit) + pagination metadata
3. **UI:** Shows answer + sources, then displays "Show 12 more" button
4. **User:** Clicks "Show 12 more"
5. **UI:** Sends "show more" query to backend
6. **Backend:** Detects continuation, validates, returns next batch (or all remaining)
7. **UI:** Appends new results to chat + updated pagination metadata

### Scenario: User asks regular question (no pagination needed)
1. **User:** "What's the status of project X?"
2. **Backend:** Returns answer + 3 relevant sources
3. **UI:** Shows answer + sources (no "Show More" button)
4. **Flow Complete**

## Data Flow

```
Backend Response
  ↓
{ answer, sources, pagination?: { has_more, remaining_count } }
  ↓
ChatMessage (including pagination)
  ↓
ChatConversation Component
  ├─ Renders answer
  ├─ Renders sources
  └─ Shows "Show N more" button if has_more=true
      ↓ (on click)
  onShowMore(messageIndex)
      ↓
  AgentChatPage.handleShowMore()
      ↓
  Send "show more" query
      ↓
  Backend validation + continuation
      ↓
  Append response to chat history
```

## Styling

- **Button Color:** Brand blue (#233a87)
- **Hover:** Darker blue (#1a2d6b)
- **Icon:** ChevronDown from lucide-react
- **Disabled State:** 50% opacity
- **Text:** "Show X more" in medium font weight

## Backward Compatibility

The component maintains full backward compatibility:
- Messages without pagination simply won't show the button
- Old response format (without pagination) still works
- Graceful fallback if pagination data is missing

## Testing Checklist

- [ ] Message renders without pagination (normal query) - no button shown
- [ ] Message renders with pagination - button shows correct count
- [ ] Click "Show more" - sends continuation query
- [ ] Loading state during continuation - button disabled
- [ ] Multiple continuations work - buttons appear on each response
- [ ] Pagination metadata preserved in chat history
- [ ] Sources still render correctly alongside pagination
