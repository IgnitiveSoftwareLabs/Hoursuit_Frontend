import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../customBaseQuery";

// TypeScript interfaces for SystemLog
export interface SystemLogType {
  id: number;
  company_id: number;
  model_name: string;
  record_id: string;
  action_type: "CREATE" | "UPDATE" | "DELETE";
  changed_fields?: any;
  performed_by: number;
  performed_by_name?: string;
  user_role?: string;
  ip_address?: string;
  user_agent?: string;
  request_method?: string;
  endpoint?: string;
  description?: string;
  status: "SUCCESS" | "FAILED";
  error_message?: string;
  execution_time?: number;
  additional_data?: any;
  CompanyId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    FirstName: string;
    LastName: string;
    Email: string;
  };
  company?: {
    id: number;
    name: string;
  };
}

export interface SystemLogResponse {
  success: boolean;
  message: string;
  result: SystemLogType[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    summary: {
      total_logs: number;
      create_count: number;
      update_count: number;
      delete_count: number;
    };
  };
}

export interface SingleSystemLogResponse {
  success: boolean;
  message: string;
  result: SystemLogType;
}

export interface SystemLogStatsResponse {
  success: boolean;
  message: string;
  result: {
    period: {
      days: number;
      start_date: string;
      end_date: string;
    };
    action_stats: Array<{
      action_type: string;
      count: number;
    }>;
    model_stats: Array<{
      model_name: string;
      count: number;
    }>;
    user_stats: Array<{
      performed_by: number;
      performed_by_name: string;
      count: number;
    }>;
    daily_activity: Array<{
      date: string;
      count: number;
    }>;
  };
}

export interface FilterOptionsResponse {
  success: boolean;
  message: string;
  result: {
    model_names: string[];
    users: Array<{
      id: number;
      name: string;
    }>;
    action_types: string[];
    status_options: string[];
  };
}

export interface SystemLogFilters {
  page?: number;
  limit?: number;
  search?: string;
  model_name?: string;
  action_type?: string;
  performed_by?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
}

export const systemLogApi = createApi({
  reducerPath: "systemLogApi",
  baseQuery: customBaseQuery,
  tagTypes: ["SystemLog", "SystemLogStats", "SystemLogFilters"],
  endpoints: (builder) => ({
    // Get all system logs with filtering and pagination
    getSystemLogs: builder.query<SystemLogResponse, SystemLogFilters | any>({
      query: (filters = {}) => ({
        url: "/system-logs",
        method: "GET",
        params: filters,
      }),
      providesTags: (result) =>
        result?.result
          ? [
              "SystemLog",
              ...result.result.map((log) => ({
                type: "SystemLog" as const,
                id: log.id,
              })),
            ]
          : ["SystemLog"],
    }),

    // Get specific system log by ID
    getSystemLogById: builder.query<SingleSystemLogResponse, number>({
      query: (id) => ({
        url: `/system-logs/${id}`,
        method: "GET",
      }),
      providesTags: (_, __, id) => [{ type: "SystemLog", id }],
    }),

    // Get system log statistics
    getSystemLogStats: builder.query<SystemLogStatsResponse, { days?: number }>(
      {
        query: ({ days = 30 }) => ({
          url: "/system-logs/stats",
          method: "GET",
          params: { days },
        }),
        providesTags: ["SystemLogStats"],
      }
    ),

    // Get filter options for dropdowns
    getFilterOptions: builder.query<FilterOptionsResponse, void>({
      query: () => ({
        url: "/system-logs/filter-options",
        method: "GET",
      }),
      providesTags: ["SystemLogFilters"],
    }),

    // Soft delete system log
    deleteSystemLog: builder.mutation<
      { success: boolean; message: string },
      number
    >({
      query: (id) => ({
        url: `/system-logs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, id) => [
        { type: "SystemLog", id },
        "SystemLog",
        "SystemLogStats",
      ],
    }),

    // Bulk cleanup old logs
    cleanupOldLogs: builder.mutation<
      {
        success: boolean;
        message: string;
        result: { affected_rows: number; cutoff_date: string };
      },
      { days: number }
    >({
      query: (data) => ({
        url: "/system-logs/cleanup",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SystemLog", "SystemLogStats"],
    }),

    // Export system logs (returns CSV data as text)
    exportSystemLogs: builder.mutation<string, SystemLogFilters>({
      query: (filters) => ({
        url: "/system-logs/export",
        method: "POST",
        body: filters,
        responseHandler: (response) => response.text(),
      }),
    }),
  }),
});

export const {
  useGetSystemLogsQuery,
  useGetSystemLogByIdQuery,
  useGetSystemLogStatsQuery,
  useGetFilterOptionsQuery,
  useDeleteSystemLogMutation,
  useCleanupOldLogsMutation,
  useExportSystemLogsMutation,
  useLazyGetSystemLogsQuery,
  useLazyGetSystemLogStatsQuery,
} = systemLogApi;