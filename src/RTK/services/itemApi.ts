import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const itemApi = createApi({
  reducerPath: 'itemApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Item'],
  endpoints: (builder) => ({
    getItems: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 10, search = '' }) =>
        `/item/get?page=${page}&limit=${limit}&search=${search}`,
      providesTags: ['Item'],
    }),
    getSingleItem: builder.query<any, number | string>({
      query: (id) => `/item/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Item', id }],
    }),
    createItem: builder.mutation<any, {id: any; payload: any}>({
      query: (body) => ({
        url: '/item',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Item'],
    }),
    updateItem: builder.mutation<any, { id: any; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/item/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['Item'],
    }),
    deleteItem: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/item/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Item'],
    }),
  }),
});

export const {
  useGetItemsQuery,
  useGetSingleItemQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
} = itemApi;