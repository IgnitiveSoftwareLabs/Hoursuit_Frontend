import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface RequestDepositorType {
  value: any[];
  curDepositorPage: number;
  totalPages: number;
  search: string;
}

const initialState: RequestDepositorType = {
  value: [],
  curDepositorPage: 1,
  totalPages: 1,
  search: '',
};

const RequestDepositorSlice = createSlice({
  name: 'RequestDepositor',
  initialState,
  reducers: {
    setDeposits: (state, action: PayloadAction<any>) => {
      state.value = action.payload;
    },
    appendDeposits: (state, action: PayloadAction<any>) => {
      state.value = [...state.value, ...action.payload];
    },
    setAddDeposit: (state, action: PayloadAction<any>) => {
      state.value = [...state.value, action.payload];
    },
    setUpdateDeposit: (state, action: PayloadAction<any>) => {
      state.value = state.value.map((item) => (item.id === action.payload.id ? action.payload : item));
    },
    setDeleteDeposit: (state, action: PayloadAction<any>) => {
      state.value = state.value.filter((item) => item.id !== action.payload);
    },
    setDepositorPage: (state, action: PayloadAction<number>) => {
      state.curDepositorPage = action.payload;
    },
    setDepositorTotalPages: (state, action: PayloadAction<number>) => {
      state.totalPages = action.payload;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.curDepositorPage = 1;
      state.value = [];
      state.totalPages = 1;
    },
  },
});

export const {
  setDeposits,
  appendDeposits,
  setAddDeposit,
  setUpdateDeposit,
  setDeleteDeposit,
  setDepositorPage,
  setDepositorTotalPages,
  setSearch,
} = RequestDepositorSlice.actions;

export default RequestDepositorSlice.reducer;