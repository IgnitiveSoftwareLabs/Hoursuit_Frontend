import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const debitNoteApi = createApi({
  reducerPath: 'debitNoteApi',
  baseQuery: customBaseQuery,
  tagTypes: ['DebitNote', 'GLBalance', 'Vendor', 'JournalEntry'],
  endpoints: (builder) => ({
    getDebitNotes: builder.query<any, { page?: number; limit?: number; search?: string; status?: string }>({
      query: (params) => ({
        url: '/finance/debit-notes',
        params,
      }),
      providesTags: ['DebitNote'],
    }),
    getDebitNoteById: builder.query<any, number | string>({
      query: (id) => ({
        url: `/finance/debit-notes/${id}`,
      }),
      providesTags: ['DebitNote'],
    }),
    createDebitNote: builder.mutation<any, any>({
      query: (body) => ({
        url: '/finance/debit-notes',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DebitNote', 'GLBalance', 'Vendor', 'JournalEntry'],
    }),
    updateDebitNote: builder.mutation<any, { id: number | string; body: any }>({
      query: ({ id, body }) => ({
        url: `/finance/debit-notes/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['DebitNote', 'GLBalance', 'Vendor', 'JournalEntry'],
    }),
    deleteDebitNote: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/finance/debit-notes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DebitNote'],
    }),
  }),
});

export const {
  useGetDebitNotesQuery,
  useGetDebitNoteByIdQuery,
  useCreateDebitNoteMutation,
  useUpdateDebitNoteMutation,
  useDeleteDebitNoteMutation,
} = debitNoteApi;
