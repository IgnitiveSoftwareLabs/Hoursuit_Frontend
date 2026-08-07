import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const paymentMethodApi = createApi({
  reducerPath: 'paymentMethodApi',
  baseQuery: customBaseQuery,
  tagTypes: ['PaymentMethod'],
  endpoints: (builder) => ({
    getPaymentMethods: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 10, search = '' }) =>
        `/payment-method/get?page=${page}&limit=${limit}&search=${search}`,
      providesTags: ['PaymentMethod'],
    }),
    getPaymentMethodById: builder.query<any, number | string>({
      query: (id) => `/payment-method/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'PaymentMethod', id }],
    }),
    createPaymentMethod: builder.mutation<any, any>({
      query: (body) => ({
        url: '/payment-method/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PaymentMethod'],
    }),
    updatePaymentMethod: builder.mutation<any, { id: any; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/payment-method/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['PaymentMethod'],
    }),
    deletePaymentMethod: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/payment-method/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PaymentMethod'],
    }),
  }),
});

export const {
  useGetPaymentMethodsQuery,
  useGetPaymentMethodByIdQuery,
  useCreatePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
  useDeletePaymentMethodMutation,
} = paymentMethodApi;
