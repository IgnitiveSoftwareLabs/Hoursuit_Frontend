import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface InventoryType {
    value: any[],
    curInventoryPage: number,
    totalPages: number,
}
const initialState: InventoryType = {
    value: [],
    curInventoryPage: 1,
    totalPages: 1,
}
const InventorySlice = createSlice({
    name: "Inventory",
    initialState,
    reducers: {
        setInventory: (state, action: PayloadAction<any>) => {
            state.value = action.payload
        },
        setAddInventorys: (state, action: PayloadAction<any>) => {
            state.value = [...state.value, action.payload]
        },
        setUpdateInventorys: (state, action: PayloadAction<any>) => {
            state.value = state.value.map((item) => item.id === action.payload.id ? action.payload : item)
        },
        setDeleteInventorys: (state, action: PayloadAction<any>) => {
            state.value = state.value.filter((item) => item.id !== action.payload)
        },
        setInventoryPage: (state, action: PayloadAction<any>) => {
            state.curInventoryPage = action.payload
        },
        setInventoryTotalPages: (state, action: PayloadAction<any>) => {
            state.totalPages = action.payload
        }
    }
})


export const { setInventory, setAddInventorys, setUpdateInventorys, setDeleteInventorys,
    setInventoryPage, setInventoryTotalPages
 } = InventorySlice.actions;
export default InventorySlice.reducer;