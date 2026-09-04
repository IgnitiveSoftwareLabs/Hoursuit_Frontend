import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../customBaseQuery";

export interface TransactionSummaryKPIs {
  purchases: {
    totalPOs: number;
    openPOs: number;
    totalGRNs: number;
    totalBills: number;
    totalBilledAmount: number;
    totalPaidAmount: number;
    unpaidBillAmount: number;
    totalReturns: number;
    totalCredits: number;
    totalCreditsAmount: number;
    totalRefunds: number;
    totalRefundsAmount: number;
  };
  sales: {
    totalSOs: number;
    openSOs: number;
    totalSOAmount: number;
    totalChallans: number;
    totalSalesReturns: number;
  };
  finance: {
    totalJournalEntries: number;
    totalDebitAmount: number;
  };
}

export interface MonthlyTrendItem {
  month: string;
  purchaseAmount: number;
  salesAmount: number;
  count: number;
}

export interface RecentActivityItem {
  id: string;
  rawId: number;
  type: string;
  typeCode: string;
  docNumber: string;
  date: string;
  amount?: number;
  entity: string;
  entityType: string;
  status: string;
  viewUrl: string;
}

export interface TransactionSummaryResponse {
  status: boolean;
  message: string;
  result: {
    kpis: TransactionSummaryKPIs;
    monthlyTrends: MonthlyTrendItem[];
    recentActivities: RecentActivityItem[];
  };
}

export interface UnifiedTransactionRow {
  id: string;
  rawId: number;
  transactionType: string;
  transactionTypeCode: string;
  docNumber: string;
  date: string;
  entityName: string;
  entityType: "Vendor" | "Customer" | "Warehouse" | "Other";
  subsidiaryName?: string;
  amount?: number;
  currency?: string;
  status: string;
  viewUrl: string;
}

export interface TransactionListResponse {
  status: boolean;
  message: string;
  result: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    rows: UnifiedTransactionRow[];
  };
}

export interface TransactionListParams {
  type?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const transactionOverviewApi = createApi({
  reducerPath: "transactionOverviewApi",
  baseQuery: customBaseQuery,
  tagTypes: ["TransactionOverview"],
  endpoints: (builder) => ({
    getTransactionSummary: builder.query<TransactionSummaryResponse, void>({
      query: () => ({
        url: "/transaction-overview/summary",
        method: "GET",
      }),
      providesTags: ["TransactionOverview"],
    }),
    getTransactionList: builder.query<TransactionListResponse, TransactionListParams>({
      query: (params) => ({
        url: "/transaction-overview/list",
        method: "GET",
        params: {
          type: params.type || "ALL",
          status: params.status || undefined,
          search: params.search || undefined,
          startDate: params.startDate || undefined,
          endDate: params.endDate || undefined,
          page: params.page || 1,
          limit: params.limit || 20,
        },
      }),
      providesTags: ["TransactionOverview"],
    }),
  }),
});

export const {
  useGetTransactionSummaryQuery,
  useGetTransactionListQuery,
} = transactionOverviewApi;
