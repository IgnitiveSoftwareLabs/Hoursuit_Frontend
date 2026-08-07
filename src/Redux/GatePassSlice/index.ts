import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface GatePassType {
    value: any[],
    curGatePassPage: number,
    totalPages: number,
}
const initialState: GatePassType = {
    value: [],
    curGatePassPage: 1,
    totalPages: 1,
}
const GatePassSlice = createSlice({
    name: "GatePass",
    initialState,
    reducers: {
        setGatePass: (state, action: PayloadAction<any>) => {
            state.value = action.payload
        },
        setAddGatePasss: (state, action: PayloadAction<any>) => {
            state.value = [...state.value, action.payload]
        },
        setUpdateGatePasss: (state, action: PayloadAction<any>) => {
            state.value = state.value.map((item) => item.id === action.payload.id ? action.payload : item)
        },
        setDeleteGatePasss: (state, action: PayloadAction<any>) => {
            state.value = state.value.filter((item) => item.id !== action.payload)
        },
        appendGatePass: (state, action: PayloadAction<any>) => {
            state.value = [...state.value, ...action.payload];
          },
        setGatePassPage: (state, action: PayloadAction<any>) => {
            state.curGatePassPage = action.payload
        },
        setGatePassTotalPages: (state, action: PayloadAction<any>) => {
            state.totalPages = action.payload
        }
    }
})


export const { setGatePass, setAddGatePasss, setUpdateGatePasss, setDeleteGatePasss,appendGatePass,
    setGatePassPage, setGatePassTotalPages
 } = GatePassSlice.actions;
export default GatePassSlice.reducer;