import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  createVendor,
  fetchVendors,
  fetchVendorById,
  updateVendor,
  deleteVendor,
} from "../../Services/index";

export interface VendorType {
  id?: number;
  vendor_name: string;
  gstin: string;
  address: string;
  city_id: number | string;
  state_code_id: number | string;
  subsidiary_id?: number | string | null;
  FirstName: string;
  LastName: string;
  Email: string;
  Password?: string;
  Phone: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  city?: {
    id: number;
    city_name: string;
    state?: {
      id: number;
      state_name: string;
      state_code: string;
    };
  };
  state?: {
    id: number;
    state_name: string;
    state_code: string;
  };
  user?: {
    id: number;
    FirstName: string;
    LastName: string;
    Email: string;
    Phone: string;
  };
  subsidiary?: {
    id: number;
    subsidiary_name: string;
  };
}

export const vendorApi = createApi({
  reducerPath: "vendorApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/",
  }),
  tagTypes: ["Vendor"],
  endpoints: (builder) => ({
    getVendors: builder.query<any, { page?: number; search?: string, option?: boolean }>({
      queryFn: async ({ page = 1, option = false }) => {
        try {
          const response = await fetchVendors();
          return { data: response.data };
        } catch (error: any) {
          return { error: error?.response?.data || error.message };
        }
      },
      providesTags: ["Vendor"],
    }),

    // getVendors: builder.query<any, { page?: number; search?: string, option?: boolean }>({
    //   query: ({ page = 1, search = '', option = false }) => {
    //     const params = new URLSearchParams();
    //     params.set('page', String(page));
    //     if (search) params.set('search', search);
    //     if (option) params.set('option', String(option));

    //     return `/vendor/get?${params.toString()}`;
    //   },
    //   providesTags: ['Vendor'],
    // }),

    getSingleVendor: builder.query<any, number>({
      queryFn: async (id) => {
        try {
          const response = await fetchVendorById(id);
          return { data: response.data };
        } catch (error: any) {
          return { error: error?.response?.data || error.message };
        }
      },
      providesTags: (_, __, id) => [{ type: "Vendor", id }],
    }),

    createVendor: builder.mutation<any, Partial<VendorType>>({
      queryFn: async (payload) => {
        try {
          const response = await createVendor(payload);
          return { data: response.data };
        } catch (error: any) {
          return { error: error?.response?.data || error.message };
        }
      },
      invalidatesTags: ["Vendor"],
    }),

    updateVendor: builder.mutation<
      any,
      { id: number; payload: Partial<VendorType> }
    >({
      queryFn: async ({ id, payload }) => {
        try {
          const response = await updateVendor(id, payload);
          return { data: response.data };
        } catch (error: any) {
          return { error: error?.response?.data || error.message };
        }
      },
      invalidatesTags: (_, __, { id }) => [{ type: "Vendor", id }, "Vendor"],
    }),

    deleteVendor: builder.mutation<any, number>({
      queryFn: async (id) => {
        try {
          const response = await deleteVendor(id);
          return { data: response.data };
        } catch (error: any) {
          return { error: error?.response?.data || error.message };
        }
      },
      invalidatesTags: ["Vendor"],
    }),
  }),
});

export const {
  useGetVendorsQuery,
  useGetSingleVendorQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
} = vendorApi;