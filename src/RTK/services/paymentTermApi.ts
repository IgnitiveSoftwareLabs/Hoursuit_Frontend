import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../customBaseQuery";

export interface PaymentTermType {
  id?: number;
  name: string;
  term_type: "STANDARD" | "DATE_DRIVEN";
  days_till_net_due?: number | null;
  discount_percent?: number | null;
  days_till_discount_expires?: number | null;
  day_of_month_net_due?: number | null;
  due_next_month_if_within_days?: number | null;
  date_discount_percent?: number | null;
  day_discount_expires?: number | null;
  is_installment?: boolean;
  is_preferred?: boolean;
  isActive?: boolean;
  CompanyId?: number;
  user_id?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentTermResponse {
  message: string;
  success: boolean;
  result: PaymentTermType[];
}

export interface SinglePaymentTermResponse {
  message: string;
  success: boolean;
  result: PaymentTermType;
}

export const paymentTermApi = createApi({
  reducerPath: "paymentTermApi",
  baseQuery: customBaseQuery,
  tagTypes: ["PaymentTerm"],
  endpoints: (builder) => ({
    getPaymentTerms: builder.query<PaymentTermResponse, void>({
      query: () => "/payment-terms/get",
      providesTags: ["PaymentTerm"],
    }),
    getPaymentTermById: builder.query<SinglePaymentTermResponse, number | string>({
      query: (id) => `/payment-terms/${id}`,
      providesTags: (_result, _error, id) => [{ type: "PaymentTerm", id }],
    }),
    createPaymentTerm: builder.mutation<SinglePaymentTermResponse, Partial<PaymentTermType>>({
      query: (body) => ({
        url: "/payment-terms/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PaymentTerm"],
    }),
    updatePaymentTerm: builder.mutation<SinglePaymentTermResponse, { id: number | string; payload: Partial<PaymentTermType> }>({
      query: ({ id, payload }) => ({
        url: `/payment-terms/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["PaymentTerm"],
    }),
    deletePaymentTerm: builder.mutation<{ message: string; success: boolean }, number | string>({
      query: (id) => ({
        url: `/payment-terms/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PaymentTerm"],
    }),
  }),
});

export const {
  useGetPaymentTermsQuery,
  useGetPaymentTermByIdQuery,
  useCreatePaymentTermMutation,
  useUpdatePaymentTermMutation,
  useDeletePaymentTermMutation,
} = paymentTermApi;
