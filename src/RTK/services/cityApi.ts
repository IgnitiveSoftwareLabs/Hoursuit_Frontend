// src/RTK/services/cityApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const cityApi = createApi({
  reducerPath: 'cityApi',
  baseQuery: customBaseQuery,
  tagTypes: ['City'],
  endpoints: (builder) => ({
    getCities: builder.query<any, void>({
      query: () => '/cities/get',
      providesTags: ['City'],
    }),

    getSingleCity: builder.query<any, string | number>({
      query: (id) => `/cities/${id}`,
    }),

    getCitiesByState: builder.query<any, number | string>({
      query: (stateId) => `/city/getByState/${stateId}`,
      providesTags: ['City'],
    }),

    createCity: builder.mutation<any, any>({
      query: (data) => ({
        url: '/cities',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['City'],
    }),

    updateCity: builder.mutation<any, { id: number | string; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/cities/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['City'],
    }),

    deleteCity: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/cities/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['City'],
    }),
  }),
});

export const {
  useGetCitiesQuery,
  useGetSingleCityQuery,
  useGetCitiesByStateQuery,
  useCreateCityMutation,
  useUpdateCityMutation,
  useDeleteCityMutation,
} = cityApi;
