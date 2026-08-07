import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface NewUsersType {
    value: any[],
    curNewUsersPage: number,
    totalPages: number,
}
const initialState: NewUsersType = {
    value: [],
    curNewUsersPage: 1,
    totalPages: 1,
}
const NewUsersSlice = createSlice({
    name: "NewUsers",
    initialState,
    reducers: {
        setNewUsers: (state, action: PayloadAction<any>) => {
            state.value = action.payload
        },
        setAddNewUserss: (state, action: PayloadAction<any>) => {
            state.value = [...state.value, action.payload]
        },
        setUpdateNewUserss: (state, action: PayloadAction<any>) => {
            state.value = state.value.map((item) => item.id === action.payload.id ? action.payload : item)
        },
        setDeleteNewUserss: (state, action: PayloadAction<any>) => {
            state.value = state.value.filter((item) => item.id !== action.payload)
        },
        setNewUsersPage: (state, action: PayloadAction<any>) => {
            state.curNewUsersPage = action.payload
        },
        setNewUsersTotalPages: (state, action: PayloadAction<any>) => {
            state.totalPages = action.payload
        }
    }
})


export const { setNewUsers, setAddNewUserss, setUpdateNewUserss, setDeleteNewUserss,
    setNewUsersPage, setNewUsersTotalPages
 } = NewUsersSlice.actions;
export default NewUsersSlice.reducer;