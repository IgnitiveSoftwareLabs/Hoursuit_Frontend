import apiInstance from "../../apiservice/apiInstance";

// Get customer ledger with date range
export const getCustomerLedgerApi = async (params: {
  customer_id: string;
  from_date: string;
  to_date: string;
}) => {
  const response = await apiInstance.get("/ledger/customer", { params });
  return response.data;
};

// Get current balance of a customer
export const getCustomerBalanceApi = async (customer_id: string) => {
  const response = await apiInstance.get(`/ledger/customer/${customer_id}/balance`);
  return response.data;
};

// Get all customers' balance summary (with pagination & optional search)
export const getAllCustomersSummaryApi = async (params: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const response = await apiInstance.get("/ledger/customers-summary", { params });
  return response.data;
};
