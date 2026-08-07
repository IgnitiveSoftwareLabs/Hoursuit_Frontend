import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../customBaseQuery";

export interface ServiceCategoryType {
  id: number;
  category_name: string;
  isActive?: boolean;
  CompanyId: number;
  user_id: number;
  subsidiary_id?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceCategoryResponse {
  message: string;
  result: ServiceCategoryType[];
  totalRecords?: number;
}

export interface SingleServiceCategoryResponse {
  message: string;
  result: ServiceCategoryType;
}

export const serviceCategoryApi = createApi({
  reducerPath: "serviceCategoryApi",
  baseQuery: customBaseQuery,
  tagTypes: ["ServiceCategory"],
  endpoints: (builder) => ({
    getServiceCategories: builder.query<ServiceCategoryResponse, void>({
      query: () => "/service-categories/get",
      providesTags: ["ServiceCategory"],
    }),
    getSingleServiceCategory: builder.query<
      SingleServiceCategoryResponse,
      number
    >({
      query: (id) => `/service-categories/${id}`,
      providesTags: (_, __, id) => [{ type: "ServiceCategory", id }],
    }),
    createServiceCategory: builder.mutation<
      SingleServiceCategoryResponse,
      Partial<ServiceCategoryType>
    >({
      query: (payload) => ({
        url: "/service-categories",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["ServiceCategory"],
    }),
    updateServiceCategory: builder.mutation<
      SingleServiceCategoryResponse,
      { id: number; payload: Partial<ServiceCategoryType> }
    >({
      query: ({ id, payload }) => ({
        url: `/service-categories/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "ServiceCategory", id },
        "ServiceCategory",
      ],
    }),
    deleteServiceCategory: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/service-categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ServiceCategory"],
    }),
  }),
});

export const {
  useGetServiceCategoriesQuery,
  useGetSingleServiceCategoryQuery,
  useCreateServiceCategoryMutation,
  useUpdateServiceCategoryMutation,
  useDeleteServiceCategoryMutation,
} = serviceCategoryApi;