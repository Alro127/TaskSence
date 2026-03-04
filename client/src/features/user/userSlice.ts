import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types/api";

interface UserState {
  currentUser: User | null;
  isLoading: boolean;
}

const initialState: UserState = {
  currentUser: null,
  isLoading: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
    updateCurrentUser: (
      state,
      action: PayloadAction<Partial<User>>
    ) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
  },
});

export const { setCurrentUser, clearCurrentUser, updateCurrentUser } =
  userSlice.actions;
export default userSlice.reducer;
