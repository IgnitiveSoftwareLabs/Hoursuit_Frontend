import apiInstance from '../../apiservice/apiInstance';

// Fetch all deposits with pagination and search
export const fetchDeposits = async (page: number, limit: number = 10, search: string = '') => {
  const response = await apiInstance.get(`/request-deposit/get?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`);
  return response.data;
};

// Fetch single deposit
export const fetchSingleDeposit = async (id: string | number) => {
  const response = await apiInstance.get(`/request-deposit/getSingle/${id}`);
  return response.data;
};

// Create deposit
export const createDeposit = async (data: any) => {
  const response = await apiInstance.post('/request-deposit/create', data);
  return response.data;
};

// Update deposit
export const updateDeposit = async (id: string | number, payload: any) => {
  const response = await apiInstance.put(`/request-deposit/update/${id}`, payload);
  return response.data;
};

// Delete deposit
export const deleteDeposit = async (id: string | number) => {
  const response = await apiInstance.delete(`/request-deposit/delete/${id}`);
  return response.data;
};