import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../customBaseQuery";

export const invoiceApi = createApi({
  reducerPath: "invoiceApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Invoice"],
  endpoints: (builder) => ({
    getInvoices: builder.query<any, { page: number }>({
      query: ({ page }) => `/invoice/get?page=${page}`,
      providesTags: ["Invoice"],
    }),

    getSingleInvoice: builder.query<any, string | number>({
      query: (id) => `/invoice/getSingle/${id}`,
    }),

    createInvoice: builder.mutation<any, { billIds: number[]; remarks?: string }>({
      query: (payload) => ({
        url: "/invoice/create",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Invoice"],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetSingleInvoiceQuery,
  useCreateInvoiceMutation,
} = invoiceApi;
