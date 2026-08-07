import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const gatePassApi = createApi({
  reducerPath: 'gatePassApi',
  baseQuery: customBaseQuery,
  tagTypes: ['GatePass'],

  endpoints: (builder) => ({
    // Create gate pass
    createGatePass: builder.mutation<any, any>({
      query: (data) => ({
        url: '/gate-pass/create',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['GatePass'],
    }),

    // Fetch all gate passes
    fetchGatePasses: builder.query<any, { page: number }>({
      query: ({ page }) => `/gate-pass/get?page=${page}`,
      providesTags: ['GatePass'],
    }),

    // Fetch single gate pass
    fetchSingleGatePass: builder.query<any, string | number>({
      query: (id) => `/gate-pass/getSingle/${id}`,
      providesTags: (result, error, id) => [{ type: 'GatePass', id }],
    }),

    // Update gate pass
    updateGatePass: builder.mutation<any, { id: number | string; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/gate-pass/update/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['GatePass'],
    }),

    // Delete gate pass
    deleteGatePass: builder.mutation<any, string | number>({
      query: (id) => ({
        url: `/gate-pass/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['GatePass'],
    }),
  }),
});

export const {
  useCreateGatePassMutation,
  useFetchGatePassesQuery,
  useFetchSingleGatePassQuery,
  useUpdateGatePassMutation,
  useDeleteGatePassMutation,
} = gatePassApi;
