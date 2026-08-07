import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../customBaseQuery";

export interface AccountTypeType {
    id?: number;
    account_type_name: string;
    mis_type_id: number;
    isActive?: boolean;
    CompanyId?: number;
    user_id?: number;
    subsidiary_id?: number | string;
    createdAt?: string;
    updatedAt?: string;
    misType?: {
        id: number;
        mis_type_name: string;
    };
    subsidiary?: {
        id: number;
        subsidiary_name: string;
    };
}

export interface AccountTypeResponse {
    message: string;
    result: AccountTypeType[];
    totalRecords?: number;
}

export interface SingleAccountTypeResponse {
    message: string;
    result: AccountTypeType;
}

export const accountTypeApi = createApi({
    reducerPath: "accountTypeApi",
    baseQuery: customBaseQuery,
    tagTypes: ["AccountType"],
    endpoints: (builder) => ({
        getAccountTypes: builder.query<AccountTypeResponse, void>({
            query: () => "/platform/account-types",
            providesTags: ["AccountType"],
        }),
        getSingleAccountType: builder.query<SingleAccountTypeResponse, number>({
            query: (id) => `/platform/account-types/${id}`,
            providesTags: (_, __, id) => [{ type: "AccountType", id }],
        }),
        createAccountType: builder.mutation<
            SingleAccountTypeResponse,
            Partial<AccountTypeType>
        >({
            query: (payload) => ({
                url: "/platform/account-types",
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["AccountType"],
        }),
        updateAccountType: builder.mutation<
            SingleAccountTypeResponse,
            { id: number; payload: Partial<AccountTypeType> }
        >({
            query: ({ id, payload }) => ({
                url: `/platform/account-types/${id}`,
                method: "PUT",
                body: payload,
            }),
            invalidatesTags: (_, __, { id }) => [
                { type: "AccountType", id },
                "AccountType",
            ],
        }),
        deleteAccountType: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/platform/account-types/${id}`, method: "DELETE" }),
            invalidatesTags: ["AccountType"],
        }),
    }),
});

export const {
    useGetAccountTypesQuery,
    useGetSingleAccountTypeQuery,
    useCreateAccountTypeMutation,
    useUpdateAccountTypeMutation,
    useDeleteAccountTypeMutation,
} = accountTypeApi;