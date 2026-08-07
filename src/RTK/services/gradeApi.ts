// src/RTK/services/gradeApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export const gradeApi = createApi({
  reducerPath: 'gradeApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Grade'],
  endpoints: (builder) => ({
    getGrades: builder.query<any, void>({
      query: () => '/grade/get',
      providesTags: ['Grade'],
    }),

    getSingleGrade: builder.query<any, string | number>({
      query: (id) => `/grade/getSingle/${id}`,
    }),

    createGrade: builder.mutation<any, any>({
      query: (data) => ({
        url: '/grade/create',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Grade'],
    }),

    updateGrade: builder.mutation<any, { id: number | string; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/grade/update/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['Grade'],
    }),

    deleteGrade: builder.mutation<any, number | string>({
      query: (id) => ({
        url: `/grade/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Grade'],
    }),
  }),
});

export const {
  useGetGradesQuery,
  useGetSingleGradeQuery,
  useCreateGradeMutation,
  useUpdateGradeMutation,
  useDeleteGradeMutation,
} = gradeApi;
