// services/companyApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const companyApi = createApi({
  reducerPath: 'companyApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Company'],
  endpoints: (builder) => ({
    // Fetch companies
    fetchCompany: builder.query<any, void>({
      query: () => '/company/get',
      providesTags: ['Company'],
    }),

    // Create company
    createCompany: builder.mutation<any, any>({
      query: (data) => ({
        url: '/company/create',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Company'],
    }),

    // Update company
    updateCompany: builder.mutation<any, { id: string; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/company/update/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['Company'],
    }),

    // Delete company
    deleteCompany: builder.mutation<any, string>({
      query: (id) => ({
        url: `/company/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Company'],
    }),
  }),
});

export const {
  useFetchCompanyQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
} = companyApi;
