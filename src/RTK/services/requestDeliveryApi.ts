import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';
export const requestDeliveryApi = createApi({
  reducerPath: 'requestDeliveryApi',
  baseQuery: customBaseQuery,
  tagTypes: ['RequestDelivery'],
  endpoints: (builder) => ({
    fetchRequestDeliveries: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 10, search = '' }) => ({
        url: `/request-delivery/get?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
      }),
      providesTags: (result:any) =>
        result?.result
          ? [
              ...result.result.map(({ id }: any) => ({
                type: 'RequestDelivery' as const,
                id,
              })),
              { type: 'RequestDelivery', id: 'LIST' },
            ]
          : [{ type: 'RequestDelivery', id: 'LIST' }],
    }),

    fetchSingleRequestDelivery: builder.query<any, number>({
      query: (id) => `/request-delivery/getSingle/${id}`,
      providesTags: (result, error, id) => [{ type: 'RequestDelivery', id }],
    }),

    createRequestDelivery: builder.mutation<any, any>({
      query: (body) => ({
        url: '/request-delivery/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'RequestDelivery', id: 'LIST' }],
    }),

    updateRequestDelivery: builder.mutation<any, { id: number; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/request-delivery/update/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'RequestDelivery', id },
        { type: 'RequestDelivery', id: 'LIST' },
      ],
    }),

    deleteRequestDelivery: builder.mutation<any, number>({
      query: (id) => ({
        url: `/request-delivery/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'RequestDelivery', id },
        { type: 'RequestDelivery', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useFetchRequestDeliveriesQuery,
  useFetchSingleRequestDeliveryQuery,
  useCreateRequestDeliveryMutation,
  useUpdateRequestDeliveryMutation,
  useDeleteRequestDeliveryMutation,
} = requestDeliveryApi;
