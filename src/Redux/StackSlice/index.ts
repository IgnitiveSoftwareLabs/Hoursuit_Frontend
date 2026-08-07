import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface StackType {
    value: any[],
    curStackPage: number,
    totalPages: number,
}
const initialState: StackType = {
    value: [],
    curStackPage: 1,
    totalPages: 1,
}
const StackSlice = createSlice({
    name: "Stack",
    initialState,
    reducers: {
        setStack: (state, action: PayloadAction<any>) => {
            state.value = action.payload
        },
        setAddStacks: (state, action: PayloadAction<any>) => {
            state.value = [...state.value, action.payload]
        },
        setUpdateStacks: (state, action: PayloadAction<any>) => {
            state.value = state.value.map((item) => item.id === action.payload.id ? action.payload : item)
        },
        setDeleteStacks: (state, action: PayloadAction<any>) => {
            state.value = state.value.filter((item) => item.id !== action.payload)
        },
        setStackPage: (state, action: PayloadAction<any>) => {
            state.curStackPage = action.payload
        },
        setStackTotalPages: (state, action: PayloadAction<any>) => {
            state.totalPages = action.payload
        }
    }
})


export const { setStack, setAddStacks, setUpdateStacks, setDeleteStacks,
    setStackPage, setStackTotalPages
 } = StackSlice.actions;
export default StackSlice.reducer;