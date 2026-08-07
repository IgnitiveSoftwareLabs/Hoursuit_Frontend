import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../customBaseQuery";

export interface CategoryType {
  id?: number;
  item_category_name: string;
  subsidiary_id?: number | null;
  isActive?: boolean;
}

export const categoryApi = createApi({
  reducerPath: "categoryApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Category"],
  endpoints: (builder) => ({
    getCategories: builder.query<any, void>({
      query: () => "/category/get",
      providesTags: ["Category"],
    }),
    createCategory: builder.mutation<any, Partial<CategoryType>>({
      query: (payload) => ({
        url: "/category",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Category"],
    }),
    updateCategory: builder.mutation<
      any,
      { id: number; payload: Partial<CategoryType> }
    >({
      query: ({ id, payload }) => ({
        url: `/category/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: "Category", id }, "Category"],
    }),
    deleteCategory: builder.mutation<any, number>({
      query: (id) => ({
        url: `/category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
