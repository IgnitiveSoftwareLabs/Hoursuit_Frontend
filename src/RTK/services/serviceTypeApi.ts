import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../customBaseQuery";

export interface ServiceTypeType {
  id?: number;
  service_name: string;
  uom_id: number | string;
  service_category_id?: number | string;
  chart_of_account_id?: number | string;
  subsidiary_id?: number | string | null;
  isActive?: boolean;
  CompanyId?: number;
  user_id?: number;
  createdAt?: string;
  updatedAt?: string;
  uom?: {
    id: number;
    uom_name: string;
  };
  serviceCategory?: { id: number; category_name: string };
  chartAccount?: { id: number; account_number: string; account_name: string };
  subsidiary?: { id: number; subsidiary_name: string };
  company?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface ServiceTypeResponse {
  message: string;
  result: ServiceTypeType[];
  totalRecords?: number;
}

export interface SingleServiceTypeResponse {
  message: string;
  result: ServiceTypeType;
}

export const serviceTypeApi = createApi({
  reducerPath: "serviceTypeApi",
  baseQuery: customBaseQuery,
  tagTypes: ["ServiceType"],
  endpoints: (builder) => ({
    getServiceTypes: builder.query<ServiceTypeResponse, void>({
      query: () => "/service-types/get",
      providesTags: ["ServiceType"],
    }),
    getSingleServiceType: builder.query<SingleServiceTypeResponse, number>({
      query: (id) => `/service-types/${id}`,
      providesTags: (_, __, id) => [{ type: "ServiceType", id }],
    }),
    createServiceType: builder.mutation<
      SingleServiceTypeResponse,
      Partial<ServiceTypeType>
    >({
      query: (payload) => ({
        url: "/service-types",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["ServiceType"],
    }),
    updateServiceType: builder.mutation<
      SingleServiceTypeResponse,
      { id: number; payload: Partial<ServiceTypeType> }
    >({
      query: ({ id, payload }) => ({
        url: `/service-types/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "ServiceType", id },
        "ServiceType",
      ],
    }),
    deleteServiceType: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/service-types/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ServiceType"],
    }),
  }),
});

export const {
  useGetServiceTypesQuery,
  useGetSingleServiceTypeQuery,
  useCreateServiceTypeMutation,
  useUpdateServiceTypeMutation,
  useDeleteServiceTypeMutation,
} = serviceTypeApi;