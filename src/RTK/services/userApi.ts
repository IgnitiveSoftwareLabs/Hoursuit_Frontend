import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: customBaseQuery,
  tagTypes: ['User', 'VWMS'],
  endpoints: (builder) => ({
    // User
    getUsers: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 10, search = '' }) =>
        `/user/get?page=${page}&limit=${limit}&search=${search}`,
      providesTags: ['User'],
    }),
    getSingleUser: builder.query<any, number | string>({
      query: (id) => `/user/getSingle/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation<any, any>({
      query: (body) => ({
        url: '/user/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<any, { id: number | string; data: any }>({
      query: ({ id, data }) => ({
        url: `/user/update/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    deleteUser: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/user/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    // VWMS
    getVwmsData: builder.query<any, void>({
      query: () => '/vwms/get',
      providesTags: ['VWMS'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetSingleUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetVwmsDataQuery,
} = userApi;
