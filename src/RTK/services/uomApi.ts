import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../customBaseQuery";

export interface UOMType {
  id?: number;
  uom_name: string;
  subsidiary_id?: number | string | null;
  CompanyId?: number;
  user_id?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  subsidiary?: {
    id: number;
    subsidiary_name: string;
  };
}

export interface UOMResponse {
  message: string;
  result: UOMType[];
  totalRecords?: number;
}

export interface SingleUOMResponse {
  message: string;
  result: UOMType;
}

export const uomApi = createApi({
  reducerPath: "uomApi",
  baseQuery: customBaseQuery,
  tagTypes: ["UOM", "CsvUpload"],
  endpoints: (builder) => ({
    getUOMs: builder.query<UOMResponse, void>({
      query: () => "/uom/get",
      providesTags: ["UOM"],
    }),
    getSingleUOM: builder.query<SingleUOMResponse, number>({
      query: (id) => `/uom/${id}`,
      providesTags: (_, __, id) => [{ type: "UOM", id }],
    }),
    createUOM: builder.mutation<SingleUOMResponse, Partial<UOMType>>({
      query: (payload) => ({
        url: "/uom",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["UOM"],
    }),
    updateUOM: builder.mutation<
      SingleUOMResponse,
      { id: number; payload: Partial<UOMType> }
    >({
      query: ({ id, payload }) => ({
        url: `/uom/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: "UOM", id }, "UOM"],
    }),
    deleteUOM: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/uom/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["UOM"],
    }),
    downloadTemplate: builder.mutation<string, void>({
      query: () => ({
        url: "/uom/csv-template",
        responseHandler: (response) => response.text(),
      }),
    }),
    uploadCsv: builder.mutation<
      { message: string; result: { id: number } },
      FormData
    >({
      query: (formData) => ({
        url: "/uom/csv-upload",
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
      providesTags: (result, error, id) => [{ type: "CsvUpload", id }],
    }),
    listCsvUploads: builder.query<
      { message: string; result: any[]; pagination?: any },
      { page?: number; limit?: number; type?: string } | void
    >({
      query: (params: any) => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 10;
        const type = params?.type ?? "";
        return `/uom/uploads?page=${page}&limit=${limit}&type=${type}`;
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
  useGetUOMsQuery,
  useGetSingleUOMQuery,
  useCreateUOMMutation,
  useUpdateUOMMutation,
  useDeleteUOMMutation,
  useDownloadTemplateMutation,
  useUploadCsvMutation,
  useGetCsvStatusQuery,
  useListCsvUploadsQuery,
  useDownloadErrorsMutation,
} = uomApi;