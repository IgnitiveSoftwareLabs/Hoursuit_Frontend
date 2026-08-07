import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../customBaseQuery";

export interface HSNSACType {
  id?: number;
  code: string;
  type: "HSN" | "SAC";
  description?: string;
  subsidiary_id?: number | string | null;
  CompanyId?: number;
  user_id?: number;
  isActive?: boolean;
  createdAt?: string;
  taxPercentage?: number;
  updatedAt?: string;
  subsidiary?: {
    id: number;
    subsidiary_name: string;
  };
}

export interface HSNSACResponse {
  message: string;
  result: HSNSACType[];
  totalRecords?: number;
}

export interface SingleHSNSACResponse {
  message: string;
  result: HSNSACType;
}

export const hsnSacApi = createApi({
  reducerPath: "hsnSacApi",
  baseQuery: customBaseQuery,
  tagTypes: ["HSNSac", "CsvUpload"],
  endpoints: (builder) => ({
    getHSNSACs: builder.query<HSNSACResponse, void>({
      query: () => "/hsn-sac/get",
      providesTags: ["HSNSac"],
    }),
    getSingleHSNSAC: builder.query<SingleHSNSACResponse, number>({
      query: (id) => `/hsn-sac/${id}`,
      providesTags: (_, __, id) => [{ type: "HSNSac", id }],
    }),
    createHSNSAC: builder.mutation<SingleHSNSACResponse, Partial<HSNSACType>>({
      query: (payload) => ({
        url: "/hsn-sac",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["HSNSac"],
    }),
    updateHSNSAC: builder.mutation<
      SingleHSNSACResponse,
      { id: number; payload: Partial<HSNSACType> }
    >({
      query: ({ id, payload }) => ({
        url: `/hsn-sac/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: "HSNSac", id }, "HSNSac"],
    }),
    deleteHSNSAC: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/hsn-sac/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["HSNSac"],
    }),
    downloadTemplate: builder.mutation<string, void>({
      query: () => ({
        url: "/hsn-sac/csv-template",
        responseHandler: (response) => response.text(),
      }),
    }),
    uploadCsv: builder.mutation<
      { message: string; result: { id: number } },
      FormData
    >({
      query: (formData) => ({
        url: "/hsn-sac/csv-upload",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["CsvUpload"],
    }),
    getCsvStatus: builder.query<{ message: string; result: any }, number>({
      query: (id) => `/csv-uploads/${id}`,
      transformResponse: (response: any) => {
        try {
          const res = { ...response };
          if (res.result && typeof res.result.errors === "string") {
            res.result.errors = JSON.parse(res.result.errors);
          }
          return res;
        } catch (e) {
          return response;
        }
      },
      providesTags: (_result, _error, id) => [{ type: "CsvUpload", id }],
    }),
    listCsvUploads: builder.query<
      { message: string; result: any[]; pagination?: any },
      { page?: number; limit?: number; type?: string } | void
    >({
      query: (params: any) => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 10;
        const type = params?.type ?? "";
        return `/hsn-sac/get/uploads?page=${page}&limit=${limit}&type=${type}`;
      },
      transformResponse: (response: any) => {
        try {
          const res = { ...response };
          if (Array.isArray(res.result)) {
            res.result = res.result.map((u: any) => {
              try {
                if (typeof u.errors === "string")
                  u.errors = JSON.parse(u.errors);
              } catch (e) {
                u.errors = [];
              }
              return u;
            });
          }
          return res;
        } catch (e) {
          return response;
        }
      },
      providesTags: (result) =>
        result?.result
          ? [
              "CsvUpload",
              ...result.result.map((r: any) => ({
                type: "CsvUpload" as const,
                id: r.id,
              })),
            ]
          : ["CsvUpload"],
    }),
    downloadErrors: builder.mutation<string, number>({
      query: (id) => ({
        url: `/csv-uploads/${id}/errors`,
        responseHandler: (response) => response.text(),
      }),
    }),
  }),
});

export const {
  useGetHSNSACsQuery,
  useGetSingleHSNSACQuery,
  useCreateHSNSACMutation,
  useUpdateHSNSACMutation,
  useDeleteHSNSACMutation,
  useDownloadTemplateMutation,
  useUploadCsvMutation,
  useGetCsvStatusQuery,
  useListCsvUploadsQuery,
  useDownloadErrorsMutation,
} = hsnSacApi;