import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface LedgerEntry {
  id: number;
  transaction_date: string;
  particular: string;
  voucher_type: string;
  reference_number: string;
  debit_amount: number;
  credit_amount: number;
  balance: number;
  customer_id: number;
  CompanyId: number;
  voucher_id: number | null;
  invoice_id: number | null;
  createdAt: string;
  updatedAt: string;
  voucher: any;
  invoice: any;
}

interface Customer {
  id: number;
  name: string;
  contact: string;
  email: string;
}

interface CustomerLedger {
  customer: Customer;
  period: {
    from_date: string;
    to_date: string;
  };
  opening_balance: number;
  closing_balance: number;
  total_debit: number;
  total_credit: number;
  ledger_entries: LedgerEntry[];
}

interface CustomerBalance {
  id: number;
  name: string;
  contact: string;
  email: string;
  current_balance: number;
  last_transaction_date: string;
}

interface LedgerState {
  customerLedger: CustomerLedger | null;
  customerBalances: CustomerBalance[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const initialState: LedgerState = {
  customerLedger: null,
  customerBalances: [],
  isLoading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
};

const ledgerSlice = createSlice({
  name: 'ledger',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setCustomerLedger: (state, action: PayloadAction<CustomerLedger>) => {
      state.customerLedger = action.payload;
    },
    setCustomerBalances: (state, action: PayloadAction<CustomerBalance[]>) => {
      state.customerBalances = action.payload;
    },
    setPagination: (state, action: PayloadAction<any>) => {
      state.pagination = action.payload;
    },
    clearCustomerLedger: (state) => {
      state.customerLedger = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setCustomerLedger,
  setCustomerBalances,
  setPagination,
  clearCustomerLedger,
  clearError,
} = ledgerSlice.actions;

export default ledgerSlice.reducer;
