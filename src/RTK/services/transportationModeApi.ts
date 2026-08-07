import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  createTransportationMode,
  fetchTransportationModes,
  fetchTransportationModeById,
  updateTransportationMode,
  deleteTransportationMode,
} from "../../Services/index";

export interface TransportationModeType {
  id?: number;
  mode_name: string;
  isActive?: boolean;
  subsidiary_id?: number | string | null;
  subsidiary?: { id: number; subsidiary_name: string };
  createdAt?: string;
  updatedAt?: string;
}

export const transportationModeApi = createApi({
  reducerPath: "transportationModeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/",
  }),
  tagTypes: ["TransportationMode"],
  endpoints: (builder) => ({
    getTransportationModes: builder.query<any, void>({
      queryFn: async () => {
        try {
          const response = await fetchTransportationModes();
          return { data: response.data };
        } catch (error: any) {
          return { error: error?.response?.data || error.message };
        }
      },
      providesTags: ["TransportationMode"],
    }),

    getSingleTransportationMode: builder.query<any, number>({
      queryFn: async (id) => {
        try {
          const response = await fetchTransportationModeById(id);
          return { data: response.data };
        } catch (error: any) {
          return { error: error?.response?.data || error.message };
        }
      },
      providesTags: (_, __, id) => [{ type: "TransportationMode", id }],
    }),

    createTransportationMode: builder.mutation<
      any,
      Partial<TransportationModeType>
    >({
      queryFn: async (payload) => {
        try {
          const response = await createTransportationMode(payload);
          return { data: response.data };
        } catch (error: any) {
          return { error: error?.response?.data || error.message };
        }
      },
      invalidatesTags: ["TransportationMode"],
    }),

    updateTransportationMode: builder.mutation<
      any,
      { id: number; payload: Partial<TransportationModeType> }
    >({
      queryFn: async ({ id, payload }) => {
        try {
          const response = await updateTransportationMode(id, payload);
          return { data: response.data };
        } catch (error: any) {
          return { error: error?.response?.data || error.message };
        }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: "TransportationMode", id },
        "TransportationMode",
      ],
    }),

    deleteTransportationMode: builder.mutation<any, number>({
      queryFn: async (id) => {
        try {
          const response = await deleteTransportationMode(id);
          return { data: response.data };
        } catch (error: any) {
          return { error: error?.response?.data || error.message };
        }
      },
      invalidatesTags: ["TransportationMode"],
    }),
  }),
});

export const {
  useGetTransportationModesQuery,
  useGetSingleTransportationModeQuery,
  useCreateTransportationModeMutation,
  useUpdateTransportationModeMutation,
  useDeleteTransportationModeMutation,
} = transportationModeApi;