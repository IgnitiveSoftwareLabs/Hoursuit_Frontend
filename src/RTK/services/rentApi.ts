// src/RTK/services/rentApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const rentApi = createApi({
  reducerPath: 'rentApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Rent'],
  endpoints: (builder) => ({
    getRents: builder.query<any, void>({
      query: () => '/rent/get',
      providesTags: ['Rent'],
    }),

    getSingleRent: builder.query<any, string | number>({
      query: (id) => `/rent/getSingle/${id}`,
    }),

    createRent: builder.mutation<any, any>({
      query: (data) => ({
        url: '/rent/create',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Rent'],
    }),

    updateRent: builder.mutation<any, { id: number | string; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/rent/update/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['Rent'],
    }),

    deleteRent: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/rent/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Rent'],
    }),
  }),
});

export const {
  useGetRentsQuery,
  useGetSingleRentQuery,
  useCreateRentMutation,
  useUpdateRentMutation,
  useDeleteRentMutation,
} = rentApi;
