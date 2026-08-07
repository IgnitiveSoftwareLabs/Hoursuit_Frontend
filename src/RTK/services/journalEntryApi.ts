import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export interface JournalEntryLineItem {
  account_id: number | string;
  debit: number;
  credit: number;
  memo?: string;
  reference_no?: string;
}

export interface CreateJournalEntryPayload {
  entry_date: string;
  voucher_type_id?: number | string;
  reference_no?: string;
  narration?: string;
  invoiceHeaderId?: number | string;
  lines: JournalEntryLineItem[];
}

export const journalEntryApi = createApi({
  reducerPath: 'journalEntryApi',
  baseQuery: customBaseQuery,
  tagTypes: ['JournalEntry', 'GLBalance', 'PurchaseInvoice', 'Vendor'],
  endpoints: (builder) => ({
    getJournalEntries: builder.query<any, any>({
      query: (params) => ({
        url: '/finance/journal-entry',
        params,
      }),
      providesTags: ['JournalEntry'],
    }),
    getJournalEntryById: builder.query<
      any,
      { id: number; source: string }
    >({
      query: ({ id, source }) => ({
        url: `/finance/journal-entry/${id}?source=${source}`,
      }),
      providesTags: (_, __, { id }) => [{ type: "JournalEntry", id }],
    }),
    createJournalEntry: builder.mutation<any, CreateJournalEntryPayload>({
      query: (body) => ({
        url: '/finance/journal-entry/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['JournalEntry', 'GLBalance'],
    }),
    postJournalEntry: builder.mutation<any, { id: number | string } | CreateJournalEntryPayload>({
      query: (body) => ({
        url: '/finance/journal-entry/post',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['JournalEntry', 'GLBalance', 'PurchaseInvoice', 'Vendor'],
    }),
  }),
});

export const {
  useGetJournalEntriesQuery,
  useGetJournalEntryByIdQuery,
  useCreateJournalEntryMutation,
  usePostJournalEntryMutation,
} = journalEntryApi;
