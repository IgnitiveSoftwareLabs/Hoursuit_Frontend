import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../customBaseQuery";

export interface SubsidiaryType {
  id?: number;
  subsidiary_name: string;
  currency_id: number | string;
  parent_subsidiary_id?: number | string | null;
  isActive?: boolean;
  CompanyId?: number;
  user_id?: number;
  createdAt?: string;
  updatedAt?: string;
  currency?: {
    id: number;
    currency_name: string;
    currency_code: string;
  };
  parentSubsidiary?: {
    id: number;
    subsidiary_name: string;
  };
}

export interface SubsidiaryResponse {
  message: string;
  result: SubsidiaryType[];
  totalRecords?: number;
}

export interface SingleSubsidiaryResponse {
  message: string;
  result: SubsidiaryType;
}

export const subsidiaryApi = createApi({
  reducerPath: "subsidiaryApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Subsidiary"],
  endpoints: (builder) => ({
    getSubsidiaries: builder.query<SubsidiaryResponse, void>({
      query: () => "/subsidiary/get",
      providesTags: ["Subsidiary"],
    }),
    getSingleSubsidiary: builder.query<SingleSubsidiaryResponse, number>({
      query: (id) => `/subsidiary/${id}`,
      providesTags: (_, __, id) => [{ type: "Subsidiary", id }],
    }),
    createSubsidiary: builder.mutation<
      SingleSubsidiaryResponse,
      Partial<SubsidiaryType>
    >({
      query: (payload) => ({
        url: "/subsidiary",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Subsidiary"],
    }),
    updateSubsidiary: builder.mutation<
      SingleSubsidiaryResponse,
      { id: number; payload: Partial<SubsidiaryType> }
    >({
      query: ({ id, payload }) => ({
        url: `/subsidiary/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "Subsidiary", id },
        "Subsidiary",
      ],
    }),
    deleteSubsidiary: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/subsidiary/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Subsidiary"],
    }),
  }),
});

export const {
  useGetSubsidiariesQuery,
  useGetSingleSubsidiaryQuery,
  useCreateSubsidiaryMutation,
  useUpdateSubsidiaryMutation,
  useDeleteSubsidiaryMutation,
} = subsidiaryApi;