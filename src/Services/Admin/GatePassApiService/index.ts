// gatePassApiCalls.ts
import apiInstance from "../../apiservice/apiInstance";

// Create gate pass
export const createGatePass = async (data: any) => {
  const response = await apiInstance.post("/gate-pass/create", data);
  return response.data;
};

// Fetch all gate passes (with pagination)
export const fetchGatePasses = async (page: number) => {
  const response = await apiInstance.get(`/gate-pass/get?page=${page}`);
  return response.data;
};

// Fetch single gate pass
export const fetchSingleGatePass = async (id: string | number) => {
  const response = await apiInstance.get(`/gate-pass/getSingle/${id}`);
  return response.data;
};

// Update gate pass
export const updateGatePass = async (id: string | number, payload: any) => {
  const response = await apiInstance.put(`/gate-pass/update/${id}`, payload);
  return response.data;
};

// Delete gate pass
export const deleteGatePass = async (id: string | number) => {
  const response = await apiInstance.delete(`/gate-pass/delete/${id}`);
  return response.data;
};
