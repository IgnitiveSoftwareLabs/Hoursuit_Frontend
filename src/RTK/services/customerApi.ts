// services/customerApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const customerApi = createApi({
  reducerPath: 'customerApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Customer'],
  endpoints: (builder) => ({
   getCustomers: builder.query<any, { page?: number; search?: string, option?: boolean }>({
      query: ({ page = 1, search = '', option = false }) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        if (search) params.set('search', search);
        if (option) params.set('option', String(option));

        return `/customer/get?${params.toString()}`;
      },
      providesTags: ['Customer'],
    }),
    
    getSingleCustomer: builder.query<any, string>({
      query: (id) => `/customer/getSingle/${id}`,
      providesTags: (result, error, id) => [{ type: 'Customer', id }],
    }),
    createCustomer: builder.mutation<any, any>({
      query: (data) => ({
        url: '/customer/create',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Customer'],
    }),

    updateCustomer: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/customer/update/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Customer'],
    }),

    deleteCustomer: builder.mutation<any, string>({
      query: (id) => ({
        url: `/customer/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customer'],
    }),
    
  }),
});

export const {
  useGetCustomersQuery,
  useGetSingleCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useLazyGetCustomersQuery,
} = customerApi;
