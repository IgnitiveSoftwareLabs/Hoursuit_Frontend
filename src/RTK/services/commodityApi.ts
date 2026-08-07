// src/RTK/services/commodityApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';
interface Commodity {
  commodity_id: number;
  name: string;
  description: string;
  unit_type: string;
  gain_loss_threshold: number;
  units: string;
  CompanyId: number;
}

interface CommodityResponse {
  message: string;
  success: boolean;
  result: Commodity[];
}
export const commodityApi = createApi({
  reducerPath: 'commodityApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Commodity'],
  endpoints: (builder) => ({
    getCommodities: builder.query<CommodityResponse, void>({
      query: () => '/commodity/get',
      providesTags: ['Commodity'],
    }),
    getCommodityById: builder.query<Commodity, string | number>({
      query: (id) => `/getsinglecommodity/${id}`,
      providesTags: (result, error, id) => [{ type: 'Commodity', id }],
    }),
    createCommodity: builder.mutation<any, any>({
      query: (data) => ({
        url: '/commodity/create',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Commodity'],
    }),
    updateCommodity: builder.mutation<any, { id: string | number; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/commodity/update/${id}`,
        method: 'PUT',
        body: payload,
        formData: true,
      }),
      invalidatesTags: ['Commodity'],
    }),
    deleteCommodity: builder.mutation<any, string | number>({
      query: (id) => ({
        url: `/commodity/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Commodity'],
    }),
  }),
});

export const {
  useGetCommoditiesQuery,
  useGetCommodityByIdQuery,
  useCreateCommodityMutation,
  useUpdateCommodityMutation,
  useDeleteCommodityMutation,
} = commodityApi;
