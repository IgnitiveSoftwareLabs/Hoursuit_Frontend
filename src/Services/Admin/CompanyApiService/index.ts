import apiInstance from "../../apiservice/apiInstance";

// add client security
export const createcompanyapicall = async (data: FormData) => {
  const response = await apiInstance.post("/company/create", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// fetch client security
export const fetchcompanyapicall = async () => {
  const response = await apiInstance.get("/company/get");
  return response.data;
};

// remove client security
export const removecomapnydetailapicall = async (
  id: any
) => {
  const response = await apiInstance.delete("/company/delete/" + id);
  return response.data;
};

export const updatecompanyapicall = async (data: any) => {
  const response = await apiInstance.put(
    `/company/update/${data.id}`,
    data.payload
  );

  return response.data;
};
