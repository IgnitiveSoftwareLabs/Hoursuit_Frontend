import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const departmentApi = createApi({
  reducerPath: 'departmentApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Department'],
  endpoints: (builder) => ({
    getDepartments: builder.query<any, void>({
      query: () => '/department',
      providesTags: ['Department'],
    }),
    getDepartmentById: builder.query<any, number | string>({
      query: (id) => `/department/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Department', id }],
    }),
    createDepartment: builder.mutation<any, any>({
      query: (payload) => ({
        url: '/department',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Department'],
    }),
    updateDepartment: builder.mutation<any, { id: number; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/department/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['Department'],
    }),
    deleteDepartment: builder.mutation<any, number>({
      query: (id) => ({
        url: `/department/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Department'],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentApi;
