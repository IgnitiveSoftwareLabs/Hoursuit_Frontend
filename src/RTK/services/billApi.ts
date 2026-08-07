import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const billApi = createApi({
  reducerPath: 'billApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Bill'],
  endpoints: (builder) => ({
    getBills: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 10, search = '' }) => ({
        url: `/bill/get?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
      }),
      providesTags: (result, error, { page, search }) => [
        { type: 'Bill', id: `page-${page}-search-${search || 'all'}` },
        'Bill'
      ],
    }),

    getSingleBill: builder.query<any, string | number>({
      query: (id) => `/bill/getSingle/${id}`,
    }),

   
    updateBill: builder.mutation<any, { id: number | string; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/bill/update/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['Bill'],
    }),

  
  }),
});

export const {
  useGetBillsQuery,
  useGetSingleBillQuery,
  useUpdateBillMutation,
} = billApi;
