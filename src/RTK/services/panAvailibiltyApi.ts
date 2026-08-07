import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const panAvailibiltyApi = createApi({
  reducerPath: 'panAvailibiltyApi',
  baseQuery: customBaseQuery,
  tagTypes: ['PanAvailibilty'],
  endpoints: (builder) => ({
    getPanAvailabilities: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 10, search = '' }) =>
        `/pan-availibility/get?page=${page}&limit=${limit}&search=${search}`,
      providesTags: ['PanAvailibilty'],
    }),
    getPanAvailibilityById: builder.query<any, number | string>({
      query: (id) => `/pan-availibility/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'PanAvailibilty', id }],
    }),
    createPanAvailibility: builder.mutation<any, any>({
      query: (body) => ({
        url: '/pan-availibility/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PanAvailibilty'],
    }),
    updatePanAvailibility: builder.mutation<any, { id: any; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/pan-availibility/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['PanAvailibilty'],
    }),
    deletePanAvailibility: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/pan-availibility/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PanAvailibilty'],
    }),
  }),
});

export const {
  useGetPanAvailabilitiesQuery,
  useGetPanAvailibilityByIdQuery,
  useCreatePanAvailibilityMutation,
  useUpdatePanAvailibilityMutation,
  useDeletePanAvailibilityMutation,
} = panAvailibiltyApi;
