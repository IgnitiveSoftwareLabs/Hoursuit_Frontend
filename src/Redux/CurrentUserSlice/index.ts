import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Permission {
  id: number;
  name: string;
  module: string;
  action: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface CurrentUser {
  id: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  ProfileImage: string;
  Type: string;
  createdAt: string;
  updatedAt: string;
  permissions: Permission[];
}

interface CurrentUserState {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  lastUpdated: string | null;
}

const initialState: CurrentUserState = {
  user: null,
  isAuthenticated: false,
  lastUpdated: null,
};

const currentUserSlice = createSlice({
  name: 'currentUser',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<CurrentUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.lastUpdated = new Date().toISOString();
    },
    updateUserPermissions: (state, action: PayloadAction<Permission[]>) => {
      if (state.user) {
        state.user.permissions = action.payload;
        state.lastUpdated = new Date().toISOString();
      }
    },
    updateUserProfile: (state, action: PayloadAction<Partial<CurrentUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        state.lastUpdated = new Date().toISOString();
      }
    },
    clearCurrentUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.lastUpdated = null;
    },
  },
});

export const { 
  setCurrentUser, 
  updateUserPermissions, 
  updateUserProfile, 
  clearCurrentUser 
} = currentUserSlice.actions;

export default currentUserSlice.reducer;