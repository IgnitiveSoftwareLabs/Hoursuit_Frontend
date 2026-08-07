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
  type: "deposit" | "delivery";
  customerName: string;
  commodityName: string;
  warehouseName: string;
  stackName: string;
  quantity: number;
  quantityUnit: string;
  rate: number;
  value: number;
  vehicleNo: string;
  movementStatus: string;
  originalWeight: number;
  originalWeightUnit: string;
}

export interface MovementStats {
  totalInward: number;
  totalOutward: number;
  netMovement: number;
  totalTransactions: number;
  inwardValue: number;
  outwardValue: number;
  weightUnit: string;
  currency: string;
}

// Stock Register Types
export interface StockData {
  id: number;
  warehouseName: string;
  stackName: string;
  customerName: string;
  commodityName: string;
  currentStock: number;
  availableBags: number;
  capacity: number;
  availableCapacity: number;
  occupancyPercentage: number;
  totalValue: number;
  lastMovementDate: string;
  status: "healthy" | "low" | "critical" | "empty";
  weightUnit: string;
  originalWeight: number;
  originalWeightUnit: string;
}

export interface StockStats {
  totalStacks: number;
  totalStock: number;
  lowStockAlerts: number;
  totalStockValue: number;
  weightUnit: string;
  currency: string;
  stacksTrend?: string;
  stacksTrendValue?: string;
  stockTrend?: string;
  stockTrendValue?: string;
  lowStockTrend?: string;
  lowStockTrendValue?: string;
  totalStockValueTrend?: string;
  totalStockValueTrendValue?: string;
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
  outstandingTrend?: string;
  outstandingTrendValue?: string;
  debitTrend?: string;
  debitTrendValue?: string;
  creditTrend?: string;
  creditTrendValue?: string;
  customersTrend?: string;
  customersTrendValue?: string;
}

// Warehouse Occupancy Types
export interface WarehouseOccupancyData {
  id: number;
  warehouseName: string;
  location: string;
  totalCapacity: number;
  occupiedCapacity: number;
  availableCapacity: number;
  currentStock: number;
  occupancyPercentage: number;
  utilizationEfficiency: number;
  activeStacks: number;
  totalStacks: number;
  activeCustomers: number;
  totalStockValue: number;
  capacityUnit: string;
  lastUpdated: string;
  status: "optimal" | "high" | "critical" | "underutilized";
}

export interface OccupancyStats {
  totalWarehouses: number;
  averageOccupancy: number;
  totalCapacity: number;
  utilizationEfficiency: number;
  activeCustomers: number;
  capacityUnit: string;
  warehousesTrend?: string;
  warehousesTrendValue?: string;
  occupancyTrend?: string;
  occupancyTrendValue?: string;
  utilizationTrend?: string;
  utilizationTrendValue?: string;
  customersTrend?: string;
  customersTrendValue?: string;
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
  transactionsTrend?: string;
  transactionsTrendValue?: string;
  amountTrend?: string;
  amountTrendValue?: string;
  completedTrend?: string;
  completedTrendValue?: string;
  pendingTrend?: string;
  pendingTrendValue?: string;
}

// Rent Collection Report Types
export interface RentCollectionData {
  id: number;
  whrNo: number;
  customerName: string;
  commodityName: string;
  warehouseName: string;
  numberOfBags: number;
  weight: string | number; // API returns string
  originalWeight: number;
  originalWeightUnit: string;
  fromDate: string;
  toDate: string;
  totalMonths: number;
  rentRate: string | number; // API returns string
  rentType?: string;
  rentBasis?: string;
  totalAmount: string | number; // API returns string
  invoiceTotal?: string | number; // API includes this field
  remarks: string;
  invoiceId?: number;
  invoiceNumber?: string;
  status: "invoiced" | "pending";
  billDate: string;
  weightUnit: string;
}

export interface RentCollectionStats {
  totalBills: number;
  invoicedBills: number;
  pendingBills: number;
  totalRentAmount: number;
  invoicedAmount: number;
  pendingAmount: number;
  totalWeight: number;
  activeCustomers: number;
  collectionEfficiency: number;
  weightUnit: string;
  currency: string;
  billsTrend?: string;
  billsTrendValue?: string;
  amountTrend?: string;
  amountTrendValue?: string;
  collectionTrend?: string;
  collectionTrendValue?: string;
  customersTrend?: string;
  customersTrendValue?: string;
}

export interface RentCollectionFilters extends BaseReportFilters {
  status?: "invoiced" | "pending" | "";
}

// Due Payment Report Types
export interface DuePaymentData {
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  totalInvoiced: string | number;
  totalPaid: string | number;
  currentBalance: string | number;
  overdueAmount: string | number;
  lastPaymentDate: string | null;
  lastInvoiceDate: string | null;
  paymentStatus: "paid" | "partial" | "pending";
  currency: string;
  daysOverdue: number;
}

export interface DuePaymentStats {
  totalCustomers: number;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  collectionEfficiency: number;
  currency: string;
  customersTrend?: string;
  customersTrendValue?: string;
  invoicedTrend?: string;
  invoicedTrendValue?: string;
  paidTrend?: string;
  paidTrendValue?: string;
  efficiencyTrend?: string;
  efficiencyTrendValue?: string;
}

export interface DuePaymentFilters extends BaseReportFilters {
  paymentStatus?: "paid" | "partial" | "pending" | "";
}

// Billing & Invoice Report Types
export interface BillingInvoiceData {
  invoiceId: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  subtotal: string | number;
  gstPercentage: string | number;
  gstAmount: string | number;
  totalAmount: string | number;
  totalPaidAmount: string | number;
  outstandingAmount: string | number;
  totalBills: number;
  totalBillAmount: string | number;
  totalWeight: string | number;
  totalBags: number;
  paymentStatus: "paid" | "partial" | "pending";
  daysSinceInvoice: number;
  invoiceDate: string | null;
  invoiceRemarks: string;
  currency: string;
}

export interface BillingInvoiceStats {
  totalInvoices: number;
  totalInvoiceAmount: number;
  totalBills: number;
  totalBillAmount: number;
  totalOutstanding: number;
  averageInvoiceValue: number;
  currency: string;
  invoicesTrend?: string;
  invoicesTrendValue?: string;
  invoiceAmountTrend?: string;
  invoiceAmountTrendValue?: string;
  billsTrend?: string;
  billsTrendValue?: string;
  avgInvoiceTrend?: string;
  avgInvoiceTrendValue?: string;
}

export interface BillingInvoiceFilters extends BaseReportFilters {
  invoiceStatus?: "paid" | "partial" | "pending" | "";
  billType?: "all" | "bills" | "invoices";
}

// WHR Report Types
export interface WHRData {
  id: number;
  receiptNumber: string;
  depositDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  commodityName: string;
  warehouseName: string;
  godownName: string;
  stackName: string;
  goodsDescription: string;
  gradeQuality: string;
  numberOfBags: number;
  weightQuintals: number;
  originalWeight: string;
  remainingWeightQuintals: number;
  remainingBags: number;
  deliveredWeight: number;
  deliveredBags: number;
  marketPrice: number;
  totalValue: number;
  rentAmount: number;
  rentType: string;
  rentBasis: string;
  deliveryStatus:
    | "fully_delivered"
    | "partially_delivered"
    | "pending_delivery";
  bagMarks: string;
  dampProof: string;
  proofOfWeight: string;
  totalGatePasses: number;
  deliveryGatePasses: number;
  createdDate: string;
}

export interface WHRStats {
  totalWHRs: number;
  totalDepositedWeight: number;
  totalRemainingWeight: number;
  totalDeliveredWeight: number;
  totalWHRValue: number;
  totalRentAmount: number;
  averageWHRValue: number;
  deliveryEfficiency: number;
  completionRate: number;
  weightUnit: string;
  currency: string;
  trends: {
    whrTrend: "up" | "down" | "neutral";
    whrTrendValue: string;
    depositWeightTrend: "up" | "down" | "neutral";
    depositWeightTrendValue: string;
    deliveryTrend: "up" | "down" | "neutral";
    deliveryTrendValue: string;
    valueTrend: "up" | "down" | "neutral";
    valueTrendValue: string;
  };
}

export interface WHRFilters extends BaseReportFilters {
  deliveryStatus?:
    | "fully_delivered"
    | "partially_delivered"
    | "pending_delivery"
    | "";
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
    "RentCollection",
    "DuePayment",
    "BillingInvoice",
    "WHRReport",
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

    getStockRegisterStats: builder.query<
      ApiResponse<StockStats>,
      BaseReportFilters
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
        return `/reports/stock-register/stats?${params.toString()}`;
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

    getWarehouseOccupancyStats: builder.query<
      ApiResponse<OccupancyStats>,
      BaseReportFilters
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
        return `/reports/warehouse-occupancy/stats?${params.toString()}`;
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
      DateRangeFilter & {
        warehouseId?: string | number;
        commodityId?: string | number;
        customerId?: string | number;
      }
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

    // Rent Collection Report endpoints
    getRentCollection: builder.query<
      ApiResponse<RentCollectionData[]>,
      RentCollectionFilters
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
        return `/reports/rent-collection?${params.toString()}`;
      },
      providesTags: ["RentCollection"],
    }),

    getRentCollectionStats: builder.query<
      ApiResponse<RentCollectionStats>,
      RentCollectionFilters
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
        return `/reports/rent-collection/stats?${params.toString()}`;
      },
      providesTags: ["RentCollection"],
    }),

    // Due Payment Report endpoints
    getDuePayments: builder.query<
      ApiResponse<DuePaymentData[]>,
      DuePaymentFilters
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
        return `/reports/due-payments?${params.toString()}`;
      },
      providesTags: ["DuePayment"],
    }),

    getDuePaymentStats: builder.query<
      ApiResponse<DuePaymentStats>,
      DuePaymentFilters
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
        return `/reports/due-payments/stats?${params.toString()}`;
      },
      providesTags: ["DuePayment"],
    }),

    // Billing & Invoice Report endpoints
    getBillingInvoices: builder.query<
      ApiResponse<BillingInvoiceData[]>,
      BillingInvoiceFilters
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
        return `/reports/billing-invoice?${params.toString()}`;
      },
      providesTags: ["BillingInvoice"],
    }),

    getBillingInvoiceStats: builder.query<
      ApiResponse<BillingInvoiceStats>,
      BillingInvoiceFilters
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
        return `/reports/billing-invoice/stats?${params.toString()}`;
      },
      providesTags: ["BillingInvoice"],
    }),

    // WHR Report endpoints
    getWHRReport: builder.query<ApiResponse<WHRData[]>, WHRFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
        return `/reports/whr-report?${params.toString()}`;
      },
      providesTags: ["WHRReport"],
    }),

    getWHRStats: builder.query<ApiResponse<WHRStats>, WHRFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
        return `/reports/whr-report/stats?${params.toString()}`;
      },
      providesTags: ["WHRReport"],
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
  useGetStockRegisterStatsQuery,
  useGetCustomerLedgerQuery,
  useGetWarehouseOccupancyQuery,
  useGetWarehouseOccupancyStatsQuery,
  useGetMovementReportQuery,
  useGetMovementStatsQuery,
  useGetRentCollectionQuery,
  useGetRentCollectionStatsQuery,
  useGetDuePaymentsQuery,
  useGetDuePaymentStatsQuery,
  useGetBillingInvoicesQuery,
  useGetBillingInvoiceStatsQuery,
  useGetWHRReportQuery,
  useGetWHRStatsQuery,
  useExportReportMutation,
} = reportsApi;
