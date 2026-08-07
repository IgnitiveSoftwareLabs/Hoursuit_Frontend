import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../customBaseQuery";

export interface CurrencyType {
  id?: number;
  currency_code: string;
  currency_name: string;
  currency_symbol?: string | null;
  country_name?: string | null;
  decimal_places: number;
  isActive?: boolean;
  CompanyId?: number;
  user_id?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CurrencyResponse {
  message: string;
  result: CurrencyType[];
  totalRecords?: number;
}

export interface SingleCurrencyResponse {
  message: string;
  result: CurrencyType;
}

export const currencyApi = createApi({
  reducerPath: "currencyApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Currency", "CsvUpload"],
  endpoints: (builder) => ({
    getCurrencies: builder.query<CurrencyResponse, void>({
      query: () => "/currencies/get",
      providesTags: ["Currency"],
    }),
    getSingleCurrency: builder.query<SingleCurrencyResponse, number>({
      query: (id) => `/currencies/${id}`,
      providesTags: (_, __, id) => [{ type: "Currency", id }],
    }),
    createCurrency: builder.mutation<
      SingleCurrencyResponse,
      Partial<CurrencyType>
    >({
      query: (payload) => ({
        url: "/currencies",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Currency"],
    }),
    updateCurrency: builder.mutation<
      SingleCurrencyResponse,
      { id: number; payload: Partial<CurrencyType> }
    >({
      query: ({ id, payload }) => ({
        url: `/currencies/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "Currency", id },
        "Currency",
      ],
    }),
    deleteCurrency: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/currencies/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Currency"],
    }),
    downloadTemplate: builder.mutation<string, void>({
      query: () => ({
        url: "/currencies/csv-template",
        responseHandler: (response) => response.text(),
      }),
    }),
    uploadCsv: builder.mutation<
      { message: string; result: { id: number } },
      FormData
    >({
      query: (formData) => ({
        url: "/currencies/csv-upload",
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
        return `/currencies/uploads?page=${page}&limit=${limit}&type=${type}`;
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
  useGetCurrenciesQuery,
  useGetSingleCurrencyQuery,
  useCreateCurrencyMutation,
  useUpdateCurrencyMutation,
  useDeleteCurrencyMutation,
  useDownloadTemplateMutation,
  useUploadCsvMutation,
  useGetCsvStatusQuery,
  useListCsvUploadsQuery,
  useDownloadErrorsMutation,
} = currencyApi;