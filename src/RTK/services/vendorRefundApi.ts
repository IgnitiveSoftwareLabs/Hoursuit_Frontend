import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const vendorRefundApi = createApi({
  reducerPath: 'vendorRefundApi',
  baseQuery: customBaseQuery,
  tagTypes: ['VendorRefund', 'DebitNote', 'GLBalance', 'JournalEntry'],
  endpoints: (builder) => ({
    getVendorRefunds: builder.query<any, { page?: number; limit?: number; vendorId?: number; vendorCreditId?: number }>({
      query: (params) => ({
        url: '/vendor-refund/get',
        params,
      }),
      providesTags: ['VendorRefund'],
    }),
    getVendorRefundById: builder.query<any, number | string>({
      query: (id) => ({
        url: `/vendor-refund/${id}`,
      }),
      providesTags: ['VendorRefund'],
    }),
    createVendorRefund: builder.mutation<any, any>({
      query: (body) => ({
        url: '/vendor-refund/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['VendorRefund', 'DebitNote', 'GLBalance', 'JournalEntry'],
    }),
  }),
});

export const {
  useGetVendorRefundsQuery,
  useGetVendorRefundByIdQuery,
  useLazyGetVendorRefundsQuery,
  useLazyGetVendorRefundByIdQuery,
  useCreateVendorRefundMutation,
} = vendorRefundApi;
