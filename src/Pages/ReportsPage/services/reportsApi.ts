import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../../../RTK/customBaseQuery";

// Base types for API responses
export interface ApiResponse<T> {
  success: boolean;
  result: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Filter interfaces
export interface DateRangeFilter {
  dateFrom?: string;
  dateTo?: string;
}

export interface BaseReportFilters extends DateRangeFilter {
  warehouseId?: string | number;
  customerId?: string | number;
  commodityId?: string | number;
  status?: string;
  page?: number;
  limit?: number;
}

// Daily Summary Report Types
export interface DailySummaryData {
  id: number;
  date: string;
  warehouseName: string;
  totalInward: number;
  totalOutward: number;
  totalStock: number;
  occupancyPercentage: number;
  activeCustomers: number;
  totalTransactions: number;
  revenue: number;
}

export interface DailySummaryStats {
  totalInward: number;
  totalOutward: number;
  currentStock: number;
  activeCustomers: number;
  weightUnit: string;
  stockWeightUnit: string;
  trends: {
    inwardTrend: "up" | "down" | "neutral";
    inwardTrendValue: string;
    outwardTrend: "up" | "down" | "neutral";
    outwardTrendValue: string;
    stockTrend: "up" | "down" | "neutral";
    stockTrendValue: string;
    customerTrend: "up" | "down" | "neutral";
    customerTrendValue: string;
  };
}

// Movement Report Types
export interface MovementData {
  id: number;
  date: string;
  gatePassNo: string;
  customerName: string;
  commodityName: string;
  warehouseName: string;
  stackNo: string;
  quantity: number;
  rate: number;
  value: number;
  vehicleNo: string;
  status: "completed" | "pending" | "cancelled";
}

export interface MovementStats {
  totalInward: number;
  totalOutward: number;
  netMovement: number;
  totalTransactions: number;
}

// Stock Register Types
export interface StockData {
  id: number;
  warehouseName: string;
  stackNo: string;
  customerName: string;
  commodityName: string;
  grade: string;
  openingStock: number;
  inwardQuantity: number;
  outwardQuantity: number;
  currentStock: number;
  capacity: number;
  occupancyPercentage: number;
  lastMovementDate: string;
  status: "healthy" | "low" | "critical" | "empty";
  lotNumber: string;
  expiryDate?: string;
  storageRate: number;
  totalValue: number;
}

export interface StockStats {
  totalStacks: number;
  totalStock: number;
  lowStockAlerts: number;
  criticalStock: number;
}

// Customer Ledger Types
export interface LedgerEntry {
  id: number;
  date: string;
  particular: string;
  referenceNo: string;
  type: "debit" | "credit";
  amount: number;
  balance: number;
  description?: string;
}

export interface CustomerLedgerData {
  customerId: number;
  customerName: string;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  entries: LedgerEntry[];
}

export interface LedgerStats {
  totalOutstanding: number;
  totalDebit: number;
  totalCredit: number;
  activeCustomers: number;
}

// Warehouse Occupancy Types
export interface WarehouseOccupancyData {
  id: number;
  warehouseName: string;
  totalCapacity: number;
  occupiedCapacity: number;
  availableCapacity: number;
  occupancyPercentage: number;
  activeStacks: number;
  totalStacks: number;
  activeCustomers: number;
  lastUpdated: string;
}

export interface OccupancyStats {
  totalWarehouses: number;
  averageOccupancy: number;
  fullyOccupied: number;
  underUtilized: number;
}

// Transaction Report Types
export interface TransactionData {
  id: number;
  date: string;
  transactionNo: string;
  type: "inward" | "outward" | "transfer";
  customerName: string;
  warehouseName: string;
  commodityName: string;
  quantity: number;
  amount: number;
  status: "completed" | "pending" | "cancelled";
  createdBy: string;
}

export interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  completedTransactions: number;
  pendingTransactions: number;
}

// Movement Report Types
export interface MovementData {
  id: number;
  date: string;
  gatePassNo: string;
  type: "deposit" | "delivery";
  customerName: string;
  commodityName: string;
  warehouseName: string;
  stackNo: string;
  quantity: number;
  rate: number;
  value: number;
  vehicleNo: string;
  movementStatus: "Success" | "Pending" | "Partial";
}

export interface MovementStats {
  totalInward: number;
  totalOutward: number;
  netMovement: number;
  totalTransactions: number;
  inwardValue: number;
  outwardValue: number;
}

// Create the API slice
export const reportsApi = createApi({
  reducerPath: "reportsApi",
  baseQuery: customBaseQuery,
  tagTypes: [
    "DailySummary",
    "Movement",
    "Stock",
    "CustomerLedger",
    "WarehouseOccupancy",
    "Transaction",
  ],
  endpoints: (builder) => ({
    // Daily Summary Report
    getDailySummary: builder.query<
      ApiResponse<DailySummaryData[]>,
      BaseReportFilters
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
        return `/reports/daily-summary?${params.toString()}`;
      },
      providesTags: ["DailySummary"],
    }),

    getDailySummaryStats: builder.query<
      ApiResponse<DailySummaryStats>,
      DateRangeFilter
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
        return `/reports/daily-summary/stats?${params.toString()}`;
      },
      providesTags: ["DailySummary"],
    }),

    // Stock Register
    getStockRegister: builder.query<
      ApiResponse<StockData[]>,
      BaseReportFilters
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
        return `/reports/stock-register?${params.toString()}`;
      },
      providesTags: ["Stock"],
    }),

    // Customer Ledger
    getCustomerLedger: builder.query<
      ApiResponse<CustomerLedgerData[]>,
      BaseReportFilters
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
        return `/reports/customer-ledger?${params.toString()}`;
      },
      providesTags: ["CustomerLedger"],
    }),

    // Warehouse Occupancy
    getWarehouseOccupancy: builder.query<
      ApiResponse<WarehouseOccupancyData[]>,
      BaseReportFilters
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
        return `/reports/warehouse-occupancy?${params.toString()}`;
      },
      providesTags: ["WarehouseOccupancy"],
    }),

    // Movement Report endpoints
    getMovementReport: builder.query<
      ApiResponse<MovementData[]>,
      BaseReportFilters & { type?: "inward" | "outward" | "all" }
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
        return `/reports/movements?${params.toString()}`;
      },
      providesTags: ["Movement"],
    }),

    getMovementStats: builder.query<
      ApiResponse<MovementStats>,
      DateRangeFilter & { warehouseId?: string | number }
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
        return `/reports/movements/stats?${params.toString()}`;
      },
      providesTags: ["Movement"],
    }),

    // Export endpoints
    exportReport: builder.mutation<
      any,
      {
        reportType: string;
        format: "pdf" | "excel";
        filters: BaseReportFilters;
      }
    >({
      query: ({ reportType, format, filters }) => ({
        url: `/reports/export`,
        method: "POST",
        body: { reportType, format, filters },
      }),
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetDailySummaryQuery,
  useGetDailySummaryStatsQuery,
  useGetStockRegisterQuery,
  useGetCustomerLedgerQuery,
  useGetWarehouseOccupancyQuery,
  useGetMovementReportQuery,
  useGetMovementStatsQuery,
  useExportReportMutation,
} = reportsApi;
