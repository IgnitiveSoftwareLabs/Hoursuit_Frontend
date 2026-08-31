import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const classApi = createApi({
  reducerPath: 'classApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Class'],
  endpoints: (builder) => ({
    getClasses: builder.query<any, void>({
      query: () => '/class',
      providesTags: ['Class'],
    }),
    getClassById: builder.query<any, number | string>({
      query: (id) => `/class/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Class', id }],
    }),
    createClass: builder.mutation<any, any>({
      query: (payload) => ({
        url: '/class',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Class'],
    }),
    updateClass: builder.mutation<any, { id: number; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/class/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['Class'],
    }),
    deleteClass: builder.mutation<any, number>({
      query: (id) => ({
        url: `/class/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Class'],
    }),
  }),
});

export const {
  useGetClassesQuery,
  useGetClassByIdQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
} = classApi;
