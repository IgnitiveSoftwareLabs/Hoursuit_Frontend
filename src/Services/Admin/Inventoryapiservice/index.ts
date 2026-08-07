import apiInstance from "../../apiservice/apiInstance";



// fetch client security
export const getinventoryapicall = async (queryParams = '') => {
  const response = await apiInstance.get(`/inventory/get${queryParams}`);
  return response.data;
};

export const getsingleInventoryapicall = async (id:any) => {
  
  const response = await apiInstance.get(`/inventory/getSingle/${id}`);
  return response.data;
};