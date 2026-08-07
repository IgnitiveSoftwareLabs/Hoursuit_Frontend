import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../customBaseQuery";

export interface WorkCategoryType {
  id?: number;
  work_category_name: string;
  isActive?: boolean;
  CompanyId?: number;
  user_id?: number;
  subsidiary_id?: number | string;
  createdAt?: string;
  updatedAt?: string;
  company?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    username: string;
    email: string;
  };
  subsidiary?: {
    id: number;
    subsidiary_name: string;
  };
}

export interface WorkCategoryResponse {
  message: string;
  result: WorkCategoryType[];
  totalRecords?: number;
}

export interface SingleWorkCategoryResponse {
  message: string;
  result: WorkCategoryType;
}

export const workCategoryApi = createApi({
  reducerPath: "workCategoryApi",
  baseQuery: customBaseQuery,
  tagTypes: ["WorkCategory"],
  endpoints: (builder) => ({
    // Get all work categories
    getWorkCategories: builder.query<WorkCategoryResponse, void>({
      query: () => "/work-category/get",
      providesTags: ["WorkCategory"],
    }),

    // Get single work category
    getSingleWorkCategory: builder.query<SingleWorkCategoryResponse, number>({
      query: (id) => `/work-category/${id}`,
      providesTags: (_, __, id) => [{ type: "WorkCategory", id }],
    }),

    // Create new work category
    createWorkCategory: builder.mutation<
      SingleWorkCategoryResponse,
      Partial<WorkCategoryType>
    >({
      query: (payload) => ({
        url: "/work-category",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["WorkCategory"],
    }),

    // Update work category
    updateWorkCategory: builder.mutation<
      SingleWorkCategoryResponse,
      { id: number; payload: Partial<WorkCategoryType> }
    >({
      query: ({ id, payload }) => ({
        url: `/work-category/${id}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "WorkCategory", id },
        "WorkCategory",
      ],
    }),

    // Delete work category
    deleteWorkCategory: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/work-category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["WorkCategory"],
    }),
  }),
});

export const {
  useGetWorkCategoriesQuery,
  useGetSingleWorkCategoryQuery,
  useCreateWorkCategoryMutation,
  useUpdateWorkCategoryMutation,
  useDeleteWorkCategoryMutation,
} = workCategoryApi;