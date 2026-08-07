import apiInstance from "../../apiservice/apiInstance";

// Create a new voucher (Payment received)
export const createVoucherApi = async (voucherData: {
  customer_id: number;
  transaction_amount: number;
  payment_mode: string;
  voucher_date: string;
  cheque_number?: string;
  cheque_date?: string;
  bank_name?: string;
  upi_id?: string;
  remarks?: string;
}) => {
  const response = await apiInstance.post("/voucher/create", voucherData);
  return response.data;
};

// Get all vouchers with filters (pagination, search, customer, payment mode, date range)
export const getVouchersApi = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  customer_id?: number;
  payment_mode?: string;
  from_date?: string;
  to_date?: string;
}) => {
  const response = await apiInstance.get("/voucher", { params });
  return response.data;
};

// Get single voucher by ID
export const getVoucherByIdApi = async (id: number | string) => {
  const response = await apiInstance.get(`/voucher/${id}`);
  return response.data;
};
