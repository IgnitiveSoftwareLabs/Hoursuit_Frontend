import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const debitNoteApi = createApi({
  reducerPath: 'debitNoteApi',
  baseQuery: customBaseQuery,
  tagTypes: ['DebitNote', 'GLBalance', 'Vendor', 'JournalEntry', 'PurchaseInvoice'],
  endpoints: (builder) => ({
    getDebitNotes: builder.query<any, { page?: number; limit?: number; search?: string; status?: string } | void>({
      query: (params) => ({
        url: '/vendor-credit/get',
        params: params || {},
      }),
      providesTags: ['DebitNote'],
    }),
    getDebitNoteById: builder.query<any, number | string>({
      query: (id) => ({
        url: `/vendor-credit/${id}`,
      }),
      providesTags: ['DebitNote'],
    }),
    createDebitNote: builder.mutation<any, any>({
      query: (body) => ({
        url: '/vendor-credit/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DebitNote', 'GLBalance', 'Vendor', 'JournalEntry', 'PurchaseInvoice'],
    }),
    updateDebitNote: builder.mutation<any, { id: number | string; body: any }>({
      query: ({ id, body }) => ({
        url: `/finance/debit-notes/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['DebitNote', 'GLBalance', 'Vendor', 'JournalEntry', 'PurchaseInvoice'],
    }),
    deleteDebitNote: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/finance/debit-notes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DebitNote'],
    }),
    getOpenBillsForVendor: builder.query<any, number | string>({
      query: (vendorId) => ({
        url: `/vendor-credit/open-bills/${vendorId}`,
      }),
      providesTags: ['PurchaseInvoice', 'DebitNote'],
    }),
    applyVendorCreditToBills: builder.mutation<any, any>({
      query: (body) => ({
        url: '/vendor-credit/apply',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DebitNote', 'PurchaseInvoice', 'GLBalance', 'JournalEntry'],
    }),
    getVendorCreditApplications: builder.query<any, number | string>({
      query: (id) => ({
        url: `/vendor-credit/${id}/applications`,
      }),
      providesTags: ['DebitNote'],
    }),
  }),
});

export const {
  useGetDebitNotesQuery,
  useGetDebitNoteByIdQuery,
  useLazyGetDebitNotesQuery,
  useLazyGetDebitNoteByIdQuery,
  useCreateDebitNoteMutation,
  useUpdateDebitNoteMutation,
  useDeleteDebitNoteMutation,
  useGetOpenBillsForVendorQuery,
  useLazyGetOpenBillsForVendorQuery,
  useApplyVendorCreditToBillsMutation,
  useGetVendorCreditApplicationsQuery,
  useLazyGetVendorCreditApplicationsQuery,
} = debitNoteApi;
