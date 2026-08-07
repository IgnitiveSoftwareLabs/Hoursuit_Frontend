import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface RentType {
    value: any[],
    currentPage: number,
    totalPages: number,
}
const initialState: RentType = {
    value: [],
    currentPage: 1,
    totalPages: 1,
}
const RentSlice = createSlice({
    name: "Rent",
    initialState,
    reducers: {
        setRent: (state, action: PayloadAction<any>) => {
            state.value = action.payload
        },
        setAddRents: (state, action: PayloadAction<any>) => {
            state.value = [...state.value, action.payload]
        },
        setUpdateRents: (state, action: PayloadAction<any>) => {
            state.value = state.value.map((item) => item.rent_id === action.payload.rent_id ? action.payload : item)
        },
        setDeleteRents: (state, action: PayloadAction<any>) => {
            state.value = state.value.filter((item) => item.rent_id !== action.payload)
        },
        setRentPage: (state, action: PayloadAction<any>) => {
            state.currentPage = action.payload
        },
        setRentTotalPages: (state, action: PayloadAction<any>) => {
            state.totalPages = action.payload
        }
    }
})


export const { setRent, setAddRents, setUpdateRents, setDeleteRents,
    setRentPage, setRentTotalPages
 } = RentSlice.actions;
export default RentSlice.reducer;