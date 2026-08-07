// src/apiservice/billApiService.ts

import apiInstance from "../../apiservice/apiInstance";

// ✅ Get paginated bills with optional search
export const getBillsApiCall = async ({
  page = 1,
  limit = 10,
  search = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const searchQuery = search ? `&search=${encodeURIComponent(search)}` : '';
  const response = await apiInstance.get(`/bill/get?page=${page}&limit=${limit}${searchQuery}`);
  return response.data;
};

// ✅ Get a single bill by ID
export const getSingleBillApiCall = async (id: string | number) => {
  const response = await apiInstance.get(`/bill/getSingle/${id}`);
  return response.data;
};

// ✅ Update a bill by ID
export const updateBillApiCall = async ({
  id,
  payload,
}: {
  id: string | number;
  payload: any;
}) => {
  const response = await apiInstance.put(`/bill/update/${id}`, payload);
  return response.data;
};
