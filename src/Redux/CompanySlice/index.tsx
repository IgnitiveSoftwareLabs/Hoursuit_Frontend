import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface companytype {
    values: {}
}
const initialState: companytype = {
    values: {}
}
const companySlice = createSlice({
    name: "Company",
    initialState,
    reducers: {
        setcompany: (state, action: PayloadAction<any>) => {
            state.values = action.payload;
        },
        setaddcompany: (state, action: PayloadAction<any>) => {
            // state.values = [...state.values, action.payload];
            state.values = { ...state.values, ...action.payload };
        },
        setupdatecompany: (state, action: PayloadAction<any>) => {
            // state.values = state.values.map((item) => item.id === action.payload.id ? action.payload : item);
            state.values = { ...state.values, ...action.payload };
        },
        
    }
})


export const { setcompany, setaddcompany, setupdatecompany } = companySlice.actions;
export default companySlice.reducer;