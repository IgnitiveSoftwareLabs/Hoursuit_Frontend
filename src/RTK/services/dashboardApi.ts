import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../../RTK/customBaseQuery";

// Base types for API responses
export interface ApiResponse<T> {
  success: boolean;
  result: T;
  message?: string;
}

// KPI Data Types
export interface KPIData {
  totalCustomers: {
    value: number;
    change: number;
    trend: "up" | "down" | "neutral";
  };
  totalStockValue: {
    value: number;
    weight: number;
    weightUnit: string;
    change: number;
    trend: "up" | "down" | "neutral";
  };
  monthlyRevenue: {
    value: number;
    change: number;
    trend: "up" | "down" | "neutral";
  };
  activeWarehouses: {
    value: number;
    change: number;
    trend: "up" | "down" | "neutral";
  };
  recentTransactions: {
    value: number;
    change: number;
    trend: "up" | "down" | "neutral";
  };
}

// Chart Data Types
export interface ChartData {
  revenueChart: {
    month: string;
    revenue: number;
  }[];
  transactionChart: {
    date: string;
    transactions: number;
    inward: number;
    outward: number;
    weightUnit: string;
  }[];
  commodityChart: {
    name: string;
    value: number;
    customers: number;
    weightUnit: string;
  }[];
}

// Recent Activity Types
export interface RecentActivity {
  id: number;
  type: "gatepass" | "invoice" | "bill" | "voucher";
  title: string;
  description: string;
  timestamp: string;
  warehouse?: string;
  amount?: number;
  status: string;
}

// Warehouse Overview Types
export interface WarehouseOverview {
  id: number;
  name: string;
  location: string;
  totalCapacity: number;
  occupiedCapacity: number;
  occupancyPercentage: number;
  totalStacks: number;
  activeCustomers: number;
  capacityUnit: string;
}

// Low Stock Alert Types
export interface LowStockAlert {
  id: number;
  customerName: string;
  commodityName: string;
  currentStock: number;
  unit: string;
  severity: "warning" | "high" | "critical";
  lastUpdated: string;
}

// Additional Filter Types
export interface DashboardFilters {
  fromDate?: string;
  toDate?: string;
  warehouseId?: string;
  period?: string;
}

export interface WarehouseOption {
  id: number;
  name: string;
  location: string;
}

// Create the API slice
export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: customBaseQuery,
  tagTypes: [
    "KPI",
    "Charts",
    "Activities",
    "WarehouseOverview",
    "LowStockAlerts",
    "WarehouseOptions",
  ],
  endpoints: (builder) => ({
    // Get KPI Data with filters
    getKPIData: builder.query<ApiResponse<KPIData>, DashboardFilters | void>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params as any).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
          }
        });
        return `/dashboard/kpi?${searchParams.toString()}`;
      },
      providesTags: ["KPI"],
    }),

    // Get Chart Data with filters
    getChartData: builder.query<ApiResponse<ChartData>, DashboardFilters>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
          }
        });
        return `/dashboard/charts?${searchParams.toString()}`;
      },
      providesTags: ["Charts"],
    }),

    // Get Recent Activities
    getRecentActivities: builder.query<
      ApiResponse<RecentActivity[]>,
      { limit?: number }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        return `/dashboard/activities?${searchParams.toString()}`;
      },
      providesTags: ["Activities"],
    }),

    // Get Warehouse Overview
    getWarehouseOverview: builder.query<ApiResponse<WarehouseOverview[]>, void>(
      {
        query: () => "/dashboard/warehouse-overview",
        providesTags: ["WarehouseOverview"],
      }
    ),

    // Get Low Stock Alerts
    getLowStockAlerts: builder.query<
      ApiResponse<LowStockAlert[]>,
      { limit?: number }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        return `/dashboard/low-stock-alerts?${searchParams.toString()}`;
      },
      providesTags: ["LowStockAlerts"],
    }),

    // Get Warehouses for Filter Options
    getWarehouseOptions: builder.query<ApiResponse<WarehouseOption[]>, void>({
      query: () => "/dashboard/warehouses",
      providesTags: ["WarehouseOptions"],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetKPIDataQuery,
  useGetChartDataQuery,
  useGetRecentActivitiesQuery,
  useGetWarehouseOverviewQuery,
  useGetLowStockAlertsQuery,
  useGetWarehouseOptionsQuery,
} = dashboardApi;
