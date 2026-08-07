import apiInstance from "../../apiservice/apiInstance";



// fetch client security
export const getpermissionapicall = async () => {
  const response = await apiInstance.get("/permission/get");
  return response.data;
};

export const assignPermissionapicall = async (data:any) => {
  
  const response = await apiInstance.post(`/permission/assign`,data);
  return response.data;
};