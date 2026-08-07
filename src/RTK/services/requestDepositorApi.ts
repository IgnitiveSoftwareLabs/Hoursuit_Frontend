
import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const requestDepositorApi = createApi({
  reducerPath: 'requestDepositorApi',
  baseQuery: customBaseQuery,
  tagTypes: ['RequestDepositor'],

  endpoints: (builder) => ({
    fetchRequestDepositors: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 10, search = '' }) => ({
        url: `/request-deposit/get?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
      }),
      providesTags: ['RequestDepositor'],
    }),

    fetchSingleRequestDepositor: builder.query<any, string | number>({
      query: (id) => `/request-deposit/getSingle/${id}`,
      providesTags: (result, error, id) => [{ type: 'RequestDepositor', id }],
    }),

    createRequestDepositor: builder.mutation<any, any>({
      query: (body) => ({
        url: '/request-deposit/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['RequestDepositor'],
    }),

    updateRequestDepositor: builder.mutation<any, { id: string | number; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/request-deposit/update/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['RequestDepositor'],
    }),

    deleteRequestDepositor: builder.mutation<any, string | number>({
      query: (id) => ({
        url: `/request-deposit/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['RequestDepositor'],
    }),
  }),
});

export const {
  useFetchRequestDepositorsQuery,
  useFetchSingleRequestDepositorQuery,
  useCreateRequestDepositorMutation,
  useUpdateRequestDepositorMutation,
  useDeleteRequestDepositorMutation,
} = requestDepositorApi;