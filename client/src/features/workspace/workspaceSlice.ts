import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const PINNED_KEY = "tasksense_pinned_workspaces";
const RECENT_KEY = "tasksense_recent_workspaces";
const MAX_RECENT = 5;

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

interface WorkspaceLocalState {
  pinnedIds: number[];
  recentIds: number[];
}

const initialState: WorkspaceLocalState = {
  pinnedIds: loadFromStorage<number[]>(PINNED_KEY, []),
  recentIds: loadFromStorage<number[]>(RECENT_KEY, []),
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    togglePin(state, action: PayloadAction<number>) {
      const id = action.payload;
      const idx = state.pinnedIds.indexOf(id);
      if (idx >= 0) {
        state.pinnedIds.splice(idx, 1);
      } else {
        state.pinnedIds.push(id);
      }
      localStorage.setItem(PINNED_KEY, JSON.stringify(state.pinnedIds));
    },

    addRecent(state, action: PayloadAction<number>) {
      const id = action.payload;
      state.recentIds = [
        id,
        ...state.recentIds.filter((r) => r !== id),
      ].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(state.recentIds));
    },

    removeFromPinnedAndRecent(state, action: PayloadAction<number>) {
      const id = action.payload;
      state.pinnedIds = state.pinnedIds.filter((p) => p !== id);
      state.recentIds = state.recentIds.filter((r) => r !== id);
      localStorage.setItem(PINNED_KEY, JSON.stringify(state.pinnedIds));
      localStorage.setItem(RECENT_KEY, JSON.stringify(state.recentIds));
    },
  },
});

export const { togglePin, addRecent, removeFromPinnedAndRecent } =
  workspaceSlice.actions;
export default workspaceSlice.reducer;
