import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types/api";

interface UserState {
  currentUser: User | null;
  isLoading: boolean;
}

// Mock user data for development (until backend is ready)
const mockUser: User = {
  id: 1,
  email: "user@tasksense.com",
  fullName: "John Doe",
  phone: "+1 (555) 123-4567",
  gender: "MALE",
  dob: "1995-05-15T00:00:00Z",
  bio: "Passionate about productivity and task management. Always striving to do better work every day.",
  avatarUrl: null,
};

const initialState: UserState = {
  currentUser: mockUser, // Use mock data for now
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
