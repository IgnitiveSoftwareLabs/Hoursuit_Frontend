// src/RTK/services/insuranceApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const insuranceApi = createApi({
  reducerPath: 'insuranceApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Insurance'],
  endpoints: (builder) => ({
    getInsurances: builder.query<any, void>({
      query: () => '/insurance/get',
      providesTags: ['Insurance'],
    }),

    getSingleInsurance: builder.query<any, string | number>({
      query: (id) => `/insurance/getSingle/${id}`,
    }),

    createInsurance: builder.mutation<any, any>({
      query: (data) => ({
        url: '/insurance/create',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Insurance'],
    }),

    updateInsurance: builder.mutation<any, { id: number | string; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/insurance/update/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['Insurance'],
    }),

    deleteInsurance: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/insurance/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Insurance'],
    }),
  }),
});

export const {
  useGetInsurancesQuery,
  useGetSingleInsuranceQuery,
  useCreateInsuranceMutation,
  useUpdateInsuranceMutation,
  useDeleteInsuranceMutation,
} = insuranceApi;
