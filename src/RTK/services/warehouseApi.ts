// src/RTK/services/warehouseApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const warehouseApi = createApi({
  reducerPath: 'warehouseApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Warehouse'],
  endpoints: (builder) => ({
    fetchWarehouses: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 10, search = '' }) =>
        `/warehouse/get?page=${page}&limit=${limit}&search=${search}`,
      providesTags: ['Warehouse'],
    }),
    createWarehouse: builder.mutation<any, any>({
      query: (payload) => ({
        url: `/warehouse/create`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Warehouse'],
    }),
    updateWarehouse: builder.mutation<any, { id: number; data: any }>({
      query: ({ id, data }) => ({
        url: `/warehouse/update/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Warehouse'],
    }),
    deleteWarehouse: builder.mutation<any, number>({
      query: (id) => ({
        url: `/warehouse/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Warehouse'],
    }),
  }),
});

export const {
  useFetchWarehousesQuery,
  useLazyFetchWarehousesQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
} = warehouseApi;
