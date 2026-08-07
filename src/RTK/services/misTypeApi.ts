import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../customBaseQuery";

export interface MISTypeType {
    id?: number;
    mis_type_name: string;
    isActive?: boolean;
    CompanyId?: number;
    user_id?: number;
    subsidiary_id?: number | string;
    createdAt?: string;
    updatedAt?: string;
    subsidiary?: {
        id: number;
        subsidiary_name: string;
    };
}

export interface MISTypeResponse {
    message: string;
    result: MISTypeType[];
    totalRecords?: number;
}

export interface SingleMISTypeResponse {
    message: string;
    result: MISTypeType;
}

export const misTypeApi = createApi({
    reducerPath: "misTypeApi",
    baseQuery: customBaseQuery,
    tagTypes: ["MISType"],
    endpoints: (builder) => ({
        getMISTypes: builder.query<MISTypeResponse, void>({
            query: () => "/mis-types",
            providesTags: ["MISType"],
        }),
        getSingleMISType: builder.query<SingleMISTypeResponse, number>({
            query: (id) => `/mis-types/${id}`,
            providesTags: (_, __, id) => [{ type: "MISType", id }],
        }),
        createMISType: builder.mutation<
            SingleMISTypeResponse,
            Partial<MISTypeType>
        >({
            query: (payload) => ({
                url: "/mis-types",
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["MISType"],
        }),
        updateMISType: builder.mutation<
            SingleMISTypeResponse,
            { id: number; payload: Partial<MISTypeType> }
        >({
            query: ({ id, payload }) => ({
                url: `/mis-types/${id}`,
                method: "PUT",
                body: payload,
            }),
            invalidatesTags: (_, __, { id }) => [{ type: "MISType", id }, "MISType"],
        }),
        deleteMISType: builder.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `/mis-types/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["MISType"],
        }),
    }),
});

export const {
    useGetMISTypesQuery,
    useGetSingleMISTypeQuery,
    useCreateMISTypeMutation,
    useUpdateMISTypeMutation,
    useDeleteMISTypeMutation,
} = misTypeApi;