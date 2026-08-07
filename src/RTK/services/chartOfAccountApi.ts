import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../customBaseQuery";

export interface ChartOfAccountType {
    id?: number;
    account_number: string;
    account_name: string;
    account_type_id: number;
    subsidiary_id: number;
    parent_account_number?: string | null;
    currency_id: number;
    isActive?: boolean;
    CompanyId?: number;
    user_id?: number;
    createdAt?: string;
    updatedAt?: string;
    accountType?: { id: number; account_type_name: string };
    subsidiary?: { id: number; subsidiary_name: string };
    currency?: { id: number; currency_name: string; currency_code: string };
}

export interface ChartOfAccountResponse {
    message: string;
    result: ChartOfAccountType[];
    totalRecords?: number;
}

export interface SingleChartOfAccountResponse {
    message: string;
    result: ChartOfAccountType;
}

export const chartOfAccountApi = createApi({
    reducerPath: "chartOfAccountApi",
    baseQuery: customBaseQuery,
    tagTypes: ["ChartOfAccount"],
    endpoints: (builder) => ({
        getChartOfAccounts: builder.query<ChartOfAccountResponse, void>({
            query: () => "/chart-of-accounts",
            providesTags: ["ChartOfAccount"],
        }),
        getSingleChartOfAccount: builder.query<
            SingleChartOfAccountResponse,
            number
        >({
            query: (id) => `/chart-of-accounts/${id}`,
            providesTags: (_, __, id) => [{ type: "ChartOfAccount", id }],
        }),
        createChartOfAccount: builder.mutation<
            SingleChartOfAccountResponse,
            Partial<ChartOfAccountType>
        >({
            query: (payload) => ({
                url: "/chart-of-accounts",
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["ChartOfAccount"],
        }),
        updateChartOfAccount: builder.mutation<
            SingleChartOfAccountResponse,
            { id: number; payload: Partial<ChartOfAccountType> }
        >({
            query: ({ id, payload }) => ({
                url: `/chart-of-accounts/${id}`,
                method: "PUT",
                body: payload,
            }),
            invalidatesTags: (_, __, { id }) => [
                { type: "ChartOfAccount", id },
                "ChartOfAccount",
            ],
        }),
        deleteChartOfAccount: builder.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `/chart-of-accounts/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["ChartOfAccount"],
        }),
    }),
});

export const {
    useGetChartOfAccountsQuery,
    useGetSingleChartOfAccountQuery,
    useCreateChartOfAccountMutation,
    useUpdateChartOfAccountMutation,
    useDeleteChartOfAccountMutation,
} = chartOfAccountApi;