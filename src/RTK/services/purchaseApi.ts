import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const purchaseApi = createApi({
  reducerPath: 'purchaseApi',
  baseQuery: customBaseQuery,
  tagTypes: ['PurchaseOrder', 'PurchaseInvoice', 'GRN', 'PurchaseReturn', 'QualityInspection', 'Inventory', 'GLBalance', 'Vendor', 'JournalEntry', 'PurchasePayment', 'ReturnFulfillment', 'VendorCredit', 'DebitNote'],
  endpoints: (builder) => ({
    // Purchase Order
    getPurchaseOrders: builder.query<any, any>({
      query: (params) => ({
        url: '/purchase-order/get',
        params,
      }),
      providesTags: ['PurchaseOrder'],
    }),
    getPurchaseOrderById: builder.query<any, number | string>({
      query: (id) => ({
        url: `/purchase-order/${id}`,
      }),
      providesTags: ['PurchaseOrder'],
    }),
    createPurchaseOrder: builder.mutation<any, any>({
      query: (body) => ({
        url: '/purchase-order/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PurchaseOrder'],
    }),
    updatePurchaseOrder: builder.mutation<any, { id: number | string; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/purchase-order/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['PurchaseOrder'],
    }),
    updatePurchaseOrderStatus: builder.mutation<any, { id: number | string; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/purchase-order/${id}/status`,
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['PurchaseOrder'],
    }),
    deletePurchaseOrder: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/purchase-order/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PurchaseOrder'],
    }),

    // GRN (Goods Receipt Note)
    getGRNs: builder.query<any, any>({
      query: (params) => ({
        url: '/grn/get',
        params,
      }),
      providesTags: ['GRN'],
    }),
    getGRNById: builder.query<any, number | string>({
      query: (id) => ({
        url: `/grn/${id}`,
      }),
      providesTags: ['GRN'],
    }),
    createGRN: builder.mutation<any, any>({
      query: (body) => ({
        url: '/grn/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['GRN', 'PurchaseOrder'],
    }),
    updateGRN: builder.mutation<any, { id: number | string; body: any }>({
      query: ({ id, body }) => ({
        url: `/grn/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['GRN', 'PurchaseOrder'],
    }),
    updateGRNStatus: builder.mutation<any, { id: number | string; body: any }>({
      query: ({ id, body }) => ({
        url: `/grn/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['GRN', 'PurchaseOrder', 'Inventory', 'GLBalance'],
    }),
    deleteGRN: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/grn/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['GRN', 'PurchaseOrder'],
    }),

    // Quality Report
    getQualityInspections: builder.query<any, any>({
      query: (params) => ({
        url: '/quality-report/get',
        params,
      }),
      providesTags: ['QualityInspection'],
    }),
    getQualityInspectionById: builder.query<any, number | string>({
      query: (id) => ({
        url: `/quality-report/${id}`,
      }),
      providesTags: ['QualityInspection'],
    }),
    createQualityInspection: builder.mutation<any, any>({
      query: (body) => ({
        url: '/quality-report/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['QualityInspection'],
    }),
    updateQualityInspection: builder.mutation<any, { id: number | string; body: any }>({
      query: ({ id, body }) => ({
        url: `/quality-report/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['QualityInspection'],
    }),
    updateQualityInspectionStatus: builder.mutation<any, { id: number | string; body: any }>({
      query: ({ id, body }) => ({
        url: `/quality-report/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['QualityInspection'],
    }),
    deleteQualityInspection: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/quality-report/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['QualityInspection'],
    }),

    // Purchase Invoice
    getPurchaseInvoices: builder.query<any, any>({
      query: (params) => ({
        url: '/purchase-invoice/get',
        params,
      }),
      providesTags: ['PurchaseInvoice'],
    }),
    getPurchaseInvoiceById: builder.query<any, number | string>({
      query: (id) => ({
        url: `/purchase-invoice/${id}`,
      }),
      providesTags: ['PurchaseInvoice'],
    }),
    createPurchaseInvoice: builder.mutation<any, any>({
      query: (body) => ({
        url: '/purchase-invoice/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PurchaseInvoice', 'GRN'],
    }),
    updatePurchaseInvoice: builder.mutation<any, { id: number | string; body: any }>({
      query: ({ id, body }) => ({
        url: `/purchase-invoice/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['PurchaseInvoice'],
    }),
    updatePurchaseInvoiceStatus: builder.mutation<any, { id: number | string; body: any }>({
      query: ({ id, body }) => ({
        url: `/purchase-invoice/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['PurchaseInvoice', 'Vendor', 'GLBalance', 'JournalEntry'],
    }),
    deletePurchaseInvoice: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/purchase-invoice/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PurchaseInvoice'],
    }),

    // Purchase Payment
    getPurchasePayments: builder.query<any, any>({
      query: (params) => ({
        url: '/purchase-payment/get',
        params,
      }),
      providesTags: ['PurchasePayment'],
    }),
    getPurchasePaymentById: builder.query<any, number | string>({
      query: (id) => ({
        url: `/purchase-payment/${id}`,
      }),
      providesTags: ['PurchasePayment'],
    }),
    createPurchasePayment: builder.mutation<any, any>({
      query: (body) => ({
        url: '/purchase-payment/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PurchasePayment', 'PurchaseInvoice', 'Vendor', 'GLBalance'],
    }),
    updatePurchasePayment: builder.mutation<any, { id: number | string; body: any }>({
      query: ({ id, body }) => ({
        url: `/purchase-payment/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['PurchasePayment'],
    }),
    updatePurchasePaymentStatus: builder.mutation<any, { id: number | string; body: any }>({
      query: ({ id, body }) => ({
        url: `/purchase-payment/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['PurchasePayment', 'PurchaseInvoice', 'Vendor', 'GLBalance', 'JournalEntry'],
    }),
    deletePurchasePayment: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/purchase-payment/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PurchasePayment'],
    }),

    // Purchase Return
    getPurchaseReturns: builder.query<any, any>({
      query: (params) => ({
        url: '/purchase-return/get',
        params,
      }),
      providesTags: ['PurchaseReturn'],
    }),
    getPurchaseReturnById: builder.query<any, number | string>({
      query: (id) => ({
        url: `/purchase-return/${id}`,
      }),
      providesTags: ['PurchaseReturn'],
    }),
    createPurchaseReturn: builder.mutation<any, any>({
      query: (body) => ({
        url: '/purchase-return/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PurchaseReturn'],
    }),
    updatePurchaseReturn: builder.mutation<any, { id: number | string; body?: any; payload?: any }>({
      query: ({ id, body, payload }) => ({
        url: `/purchase-return/${id}`,
        method: 'PUT',
        body: body || payload,
      }),
      invalidatesTags: ['PurchaseReturn'],
    }),
    updatePurchaseReturnStatus: builder.mutation<any, { id: number | string; body?: any; payload?: any }>({
      query: ({ id, body, payload }) => ({
        url: `/purchase-return/${id}/status`,
        method: 'PATCH',
        body: body || payload,
      }),
      invalidatesTags: ['PurchaseReturn', 'Inventory', 'GLBalance'],
    }),
    deletePurchaseReturn: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/purchase-return/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PurchaseReturn'],
    }),
    getReturnFulfillments: builder.query<any, any>({
      query: (params) => ({
        url: '/purchase-return-fulfillment/get',
        params,
      }),
      providesTags: ['ReturnFulfillment', 'PurchaseReturn'],
    }),
    getReturnFulfillmentById: builder.query<any, number | string>({
      query: (id) => ({
        url: `/purchase-return-fulfillment/${id}`,
      }),
      providesTags: ['ReturnFulfillment'],
    }),
    createReturnFulfillment: builder.mutation<any, any>({
      query: (body) => ({
        url: '/purchase-return-fulfillment/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ReturnFulfillment', 'PurchaseReturn', 'Inventory', 'GLBalance', 'JournalEntry'],
    }),
    getVendorCredits: builder.query<any, any>({
      query: (params) => ({
        url: '/vendor-credit/get',
        params,
      }),
      providesTags: ['VendorCredit', 'PurchaseReturn'],
    }),
    getVendorCreditById: builder.query<any, number | string>({
      query: (id) => ({
        url: `/vendor-credit/${id}`,
      }),
      providesTags: ['VendorCredit'],
    }),
    createVendorCredit: builder.mutation<any, any>({
      query: (body) => ({
        url: '/vendor-credit/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['VendorCredit', 'PurchaseReturn', 'GLBalance', 'JournalEntry'],
    }),

    // Debit Note (Vendor Credit Aliases)
    getDebitNotes: builder.query<any, any>({
      query: (params) => ({
        url: '/vendor-credit/get',
        params,
      }),
      providesTags: ['DebitNote', 'VendorCredit'],
    }),
    createDebitNote: builder.mutation<any, any>({
      query: (body) => ({
        url: '/vendor-credit/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DebitNote', 'VendorCredit', 'GLBalance'],
    }),
    updateDebitNote: builder.mutation<any, { id: number | string; body: any }>({
      query: ({ id, body }) => ({
        url: `/vendor-credit/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['DebitNote', 'VendorCredit'],
    }),
    deleteDebitNote: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/vendor-credit/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DebitNote', 'VendorCredit'],
    }),
  }),
});

export const {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useLazyGetPurchaseOrdersQuery,
  useLazyGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useUpdatePurchaseOrderStatusMutation,
  useDeletePurchaseOrderMutation,
  useGetGRNsQuery,
  useGetGRNByIdQuery,
  useLazyGetGRNsQuery,
  useLazyGetGRNByIdQuery,
  useCreateGRNMutation,
  useUpdateGRNMutation,
  useUpdateGRNStatusMutation,
  useDeleteGRNMutation,
  useGetQualityInspectionsQuery,
  useGetQualityInspectionByIdQuery,
  useLazyGetQualityInspectionsQuery,
  useLazyGetQualityInspectionByIdQuery,
  useCreateQualityInspectionMutation,
  useUpdateQualityInspectionMutation,
  useUpdateQualityInspectionStatusMutation,
  useDeleteQualityInspectionMutation,
  useGetPurchaseInvoicesQuery,
  useGetPurchaseInvoiceByIdQuery,
  useLazyGetPurchaseInvoicesQuery,
  useLazyGetPurchaseInvoiceByIdQuery,
  useCreatePurchaseInvoiceMutation,
  useUpdatePurchaseInvoiceMutation,
  useUpdatePurchaseInvoiceStatusMutation,
  useDeletePurchaseInvoiceMutation,
  useGetPurchasePaymentsQuery,
  useGetPurchasePaymentByIdQuery,
  useLazyGetPurchasePaymentsQuery,
  useLazyGetPurchasePaymentByIdQuery,
  useCreatePurchasePaymentMutation,
  useUpdatePurchasePaymentMutation,
  useUpdatePurchasePaymentStatusMutation,
  useDeletePurchasePaymentMutation,
  useGetPurchaseReturnsQuery,
  useGetPurchaseReturnByIdQuery,
  useLazyGetPurchaseReturnsQuery,
  useLazyGetPurchaseReturnByIdQuery,
  useCreatePurchaseReturnMutation,
  useUpdatePurchaseReturnMutation,
  useUpdatePurchaseReturnStatusMutation,
  useDeletePurchaseReturnMutation,
  useGetReturnFulfillmentsQuery,
  useGetReturnFulfillmentByIdQuery,
  useLazyGetReturnFulfillmentsQuery,
  useLazyGetReturnFulfillmentByIdQuery,
  useCreateReturnFulfillmentMutation,
  useGetVendorCreditsQuery,
  useGetVendorCreditByIdQuery,
  useLazyGetVendorCreditsQuery,
  useLazyGetVendorCreditByIdQuery,
  useGetDebitNotesQuery,
  useLazyGetDebitNotesQuery,
  useCreateDebitNoteMutation,
  useUpdateDebitNoteMutation,
  useDeleteDebitNoteMutation,
} = purchaseApi;