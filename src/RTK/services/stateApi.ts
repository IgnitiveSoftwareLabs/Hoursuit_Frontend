import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const stateApi = createApi({
  reducerPath: 'stateApi',
  baseQuery: customBaseQuery,
  tagTypes: ['State'],
  endpoints: (builder) => ({
    getStates: builder.query<any, void>({
      query: () => '/states',
      providesTags: ['State'],
    }),

    getSingleState: builder.query<any, string | number>({
      query: (id) => `/states/${id}`,
    }),

    createState: builder.mutation<any, any>({
      query: (data) => ({
        url: '/states',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['State'],
    }),

    updateState: builder.mutation<any, { id: number | string; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/states/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['State'],
    }),

    deleteState: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/states/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['State'],
    }),
  }),
});

export const {
  useGetStatesQuery,
  useGetSingleStateQuery,
  useCreateStateMutation,
  useUpdateStateMutation,
  useDeleteStateMutation,
} = stateApi;