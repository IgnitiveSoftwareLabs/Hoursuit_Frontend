// services/stackApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export interface StackType {
  id: number;
  name: string;
  capacity: string;
  GodownId: number;
}

interface StackResponse {
  success: boolean;
  message: string;
  result: StackType[];
  currentPage?: number;
  totalPages?: number;
}

export const stackApi = createApi({
  reducerPath: 'stackApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Stack'],
  endpoints: (builder) => ({
    fetchStacks: builder.query<StackResponse, { godownId: number; page: number; limit: number }>({
      query: ({ godownId, page, limit }) =>
        `/stack/get/${godownId}?page=${page}&limit=${limit}`,
      providesTags: (result) =>
        result?.result
          ? [
            ...result.result.map((stack) => ({ type: 'Stack' as const, id: stack.id })),
            { type: 'Stack', id: 'LIST' },
          ]
          : [{ type: 'Stack', id: 'LIST' }],
    }),

    createStack: builder.mutation<StackType, Partial<StackType>>({
      query: (body) => ({
        url: '/stack/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Stack', id: 'LIST' }],
    }),

    updateStack: builder.mutation<StackType, Partial<StackType> & { id: number }>({
      query: ({ id, ...patch }) => ({
        url: `/stack/update/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Stack', id }],
    }),

    deleteStack: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/stack/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Stack', id }, { type: 'Stack', id: 'LIST' }],
    }),
  }),
});

export const {
  useFetchStacksQuery,
  useCreateStackMutation,
  useUpdateStackMutation,
  useDeleteStackMutation,
} = stackApi;