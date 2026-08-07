import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const registrationTypeApi = createApi({
  reducerPath: 'registrationTypeApi',
  baseQuery: customBaseQuery,
  tagTypes: ['RegistrationType'],
  endpoints: (builder) => ({
    getRegistrationTypes: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 10, search = '' }) =>
        `/registration-type/get?page=${page}&limit=${limit}&search=${search}`,
      providesTags: ['RegistrationType'],
    }),
    getRegistrationTypeById: builder.query<any, number | string>({
      query: (id) => `/registration-type/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'RegistrationType', id }],
    }),
    createRegistrationType: builder.mutation<any, any>({
      query: (body) => ({
        url: '/registration-type/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['RegistrationType'],
    }),
    updateRegistrationType: builder.mutation<any, { id: any; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/registration-type/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['RegistrationType'],
    }),
    deleteRegistrationType: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/registration-type/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['RegistrationType'],
    }),
  }),
});

export const {
  useGetRegistrationTypesQuery,
  useGetRegistrationTypeByIdQuery,
  useCreateRegistrationTypeMutation,
  useUpdateRegistrationTypeMutation,
  useDeleteRegistrationTypeMutation,
} = registrationTypeApi;
