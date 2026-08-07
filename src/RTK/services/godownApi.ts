import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

interface Godown {
  capacity: string;
  id: number;
  name: string;
  location: string;
  capacityUnit: string;
  WarehouseId?: number;
  length: number;
  breadth: number;
  sizeUnit: string;
  height: number;
  // add other fields here
}

interface GodownResponse {
  result: Godown[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

interface GodownCreateUpdatePayload {
  id?: number;
  name: string;
  location: string;
  capacity: string;
  capacityUnit: string;
  length: number;
  breadth: number;
  sizeUnit: string;
  height: number;
  WarehouseId?: number; // Optional for creation
  // other fields
}

export const godownApi = createApi({
  reducerPath: 'godownApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Godown'],
  endpoints: (builder) => ({
    fetchGodowns: builder.query<GodownResponse, { warehouseId: number; page: number; limit: number }>({
      query: ({  warehouseId,page, limit }) => `/godown/get/${warehouseId}?page=${page}&limit=${limit}`,
      providesTags: (result) =>
        result
          ? [
              ...result.result.map(({ id }) => ({ type: 'Godown' as const, id })),
              { type: 'Godown', id: 'LIST' },
            ]
          : [{ type: 'Godown', id: 'LIST' }],
    }),
    createGodown: builder.mutation<any, any>({
      query: (body) => ({
        url: '/godown/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Godown', id: 'LIST' }],
    }),
    updateGodown: builder.mutation<any, any>({
      query: ({ id, ...patch }) => ({
        url: `/godown/update/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Godown', id }],
    }),
    deleteGodown: builder.mutation<{ success: boolean; id: number }, number>({
      query: (id) => ({
        url: `/godown/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Godown', id }],
    }),
  }),
});

export const {
  useFetchGodownsQuery,
  useCreateGodownMutation,
  useUpdateGodownMutation,
  useDeleteGodownMutation,
  useLazyFetchGodownsQuery
} = godownApi;
