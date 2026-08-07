import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface VoucherAttributes {
  id: number;
  voucher_number: string;
  voucher_type: 'receive' | 'payment' | 'invoice';
  voucher_date: string;
  debit_ledger_id: number;
  credit_ledger_id: number;
  transaction_amount: number;
  payment_mode: 'cash' | 'cheque' | 'neft' | 'imps' | 'upi';
  cheque_number?: string;
  cheque_date?: string;
  bank_name?: string;
  upi_id?: string;
  remarks?: string;
  CompanyId: number;
  createdAt: string;
  updatedAt: string;
  debitCustomer?: {
    id: number;
    name: string;
  };
  creditCustomer?: {
    id: number;
    name: string;
  };
  company?: {
    id: number;
    name: string;
  };
}

export interface VoucherPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VoucherFilters {
  search?: string;
  customer_id?: number;
  payment_mode?: string;
  from_date?: string;
  to_date?: string;
}

interface VoucherState {
  vouchers: VoucherAttributes[];
  selectedVoucher: VoucherAttributes | null;
  pagination: VoucherPagination;
  filters: VoucherFilters;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
}

const initialState: VoucherState = {
  vouchers: [],
  selectedVoucher: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  filters: {},
  isLoading: false,
  isCreating: false,
  error: null,
};

const voucherSlice = createSlice({
  name: 'voucher',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCreating: (state, action: PayloadAction<boolean>) => {
      state.isCreating = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setVouchers: (state, action: PayloadAction<VoucherAttributes[]>) => {
      state.vouchers = action.payload;
    },
    addVoucher: (state, action: PayloadAction<VoucherAttributes>) => {
      state.vouchers.unshift(action.payload);
    },
    setSelectedVoucher: (state, action: PayloadAction<VoucherAttributes | null>) => {
      state.selectedVoucher = action.payload;
    },
    setPagination: (state, action: PayloadAction<VoucherPagination>) => {
      state.pagination = action.payload;
    },
    setFilters: (state, action: PayloadAction<VoucherFilters>) => {
      state.filters = action.payload;
    },
    updateFilters: (state, action: PayloadAction<Partial<VoucherFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearVouchers: (state) => {
      state.vouchers = [];
      state.selectedVoucher = null;
      state.pagination = initialState.pagination;
    },
  },
});

export const {
  setLoading,
  setCreating,
  setError,
  clearError,
  setVouchers,
  addVoucher,
  setSelectedVoucher,
  setPagination,
  setFilters,
  updateFilters,
  clearFilters,
  clearVouchers,
} = voucherSlice.actions;

export default voucherSlice.reducer;
