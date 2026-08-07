import apiInstance from "../../apiservice/apiInstance";


// add client security
export const createstackapicall = async (data:any) => {
    const response = await apiInstance.post("/stack/create", data);
    return response.data;
  };
  
  
  // remove client security
  export const removestackdetailapicall = async (
    id: any
  ) => {
    const response = await apiInstance.delete("/stack/delete/" + id);
    return response.data;
  };
  
  export const updatestackapicall = async (data: any) => {
    const response = await apiInstance.put(
      `/stack/update/${data.id}`,
      data
    );
  
    return response.data;
  };
// fetch client security
export const getstackapicall = async (id:any) => {
  const response = await apiInstance.get(`/stack/get/${id}`);
  return response.data;
};

export const getsinglestackapicall = async (id:any) => {
  
  const response = await apiInstance.get(`/stack/getSingle/${id}`);
  return response.data;
};