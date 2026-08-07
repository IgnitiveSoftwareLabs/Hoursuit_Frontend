import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const salesApi = createApi({
  reducerPath: 'salesApi',
  baseQuery: customBaseQuery,
  tagTypes: ['SalesOrder', 'DeliveryChallan', 'SalesReturn'],
  endpoints: (builder) => ({
    // Sales Order
    getSalesOrders: builder.query<any, any>({
      query: (params) => ({
        url: '/sales-order/get',
        params,
      }),
      providesTags: ['SalesOrder'],
    }),
    createSalesOrder: builder.mutation<any, any>({
      query: (body) => ({
        url: '/sales-order/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SalesOrder'],
    }),
    getSalesOrderById: builder.query<any, string | number>({
      query: (id) => `/sales-order/${id}`,
      providesTags: ['SalesOrder'],
    }),
    updateSalesOrder: builder.mutation<any, { id: string | number; data: any }>({
      query: ({ id, data }) => ({
        url: `/sales-order/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['SalesOrder'],
    }),
    updateSalesOrderStatus: builder.mutation<any, { id: string | number; data: any }>({
      query: ({ id, data }) => ({
        url: `/sales-order/${id}/status`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['SalesOrder'],
    }),
    deleteSalesOrder: builder.mutation<any, string | number>({
      query: (id) => ({
        url: `/sales-order/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SalesOrder'],
    }),

    // Delivery Challan
    getDeliveryChallans: builder.query<any, any>({
      query: (params) => ({
        url: '/delivery-challan/get',
        params,
      }),
      providesTags: ['DeliveryChallan'],
    }),
    createDeliveryChallan: builder.mutation<any, any>({
      query: (body) => ({
        url: '/delivery-challan/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DeliveryChallan'],
    }),
    getDeliveryChallanById: builder.query<any, string | number>({
      query: (id) => `/delivery-challan/${id}`,
      providesTags: ['DeliveryChallan'],
    }),
    updateDeliveryChallan: builder.mutation<any, { id: string | number; data: any }>({
      query: ({ id, data }) => ({
        url: `/delivery-challan/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['DeliveryChallan'],
    }),
    updateDeliveryChallanStatus: builder.mutation<any, { id: string | number; data: any }>({
      query: ({ id, data }) => ({
        url: `/delivery-challan/${id}/status`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['DeliveryChallan'],
    }),
    deleteDeliveryChallan: builder.mutation<any, string | number>({
      query: (id) => ({
        url: `/delivery-challan/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DeliveryChallan'],
    }),

    // Sales Return
    getSalesReturns: builder.query<any, any>({
      query: (params) => ({
        url: '/sales-return/get',
        params,
      }),
      providesTags: ['SalesReturn'],
    }),
    getSalesReturnById: builder.query<any, string | number>({
      query: (id) => `/sales-return/${id}`,
      providesTags: ['SalesReturn'],
    }),
    createSalesReturn: builder.mutation<any, any>({
      query: (body) => ({
        url: '/sales-return/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SalesReturn'],
    }),
    updateSalesReturn: builder.mutation<any, { id: string | number; data: any }>({
      query: ({ id, data }) => ({
        url: `/sales-return/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['SalesReturn'],
    }),
    updateSalesReturnStatus: builder.mutation<any, { id: string | number; data: any }>({
      query: ({ id, data }) => ({
        url: `/sales-return/${id}/status`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['SalesReturn'],
    }),
    deleteSalesReturn: builder.mutation<any, string | number>({
      query: (id) => ({
        url: `/sales-return/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SalesReturn'],
    }),
  }),
});

export const {
  useGetSalesOrdersQuery,
  useGetSalesOrderByIdQuery,
  useCreateSalesOrderMutation,
  useUpdateSalesOrderMutation,
  useUpdateSalesOrderStatusMutation,
  useDeleteSalesOrderMutation,
  useGetDeliveryChallansQuery,
  useGetDeliveryChallanByIdQuery,
  useCreateDeliveryChallanMutation,
  useUpdateDeliveryChallanMutation,
  useUpdateDeliveryChallanStatusMutation,
  useDeleteDeliveryChallanMutation,
  useGetSalesReturnsQuery,
  useGetSalesReturnByIdQuery,
  useCreateSalesReturnMutation,
  useUpdateSalesReturnMutation,
  useUpdateSalesReturnStatusMutation,
  useDeleteSalesReturnMutation,
} = salesApi;