import apiInstance from "./apiservice/apiInstance";

// ==================== UOM MASTER ====================
export const createUOM = (data: any) => apiInstance.post("/uom", data);
export const fetchUOMs = () => apiInstance.get("/uom");
export const fetchUOMById = (id: string | number) => apiInstance.get(`/uom/${id}`);
export const updateUOM = (id: string | number, data: any) => apiInstance.put(`/uom/${id}`, data);
export const deleteUOM = (id: string | number) => apiInstance.delete(`/uom/${id}`);

// ==================== VENDOR MASTER ====================
export const createVendor = (data: any) => apiInstance.post("/vendor/create", data);
export const fetchVendors = () => apiInstance.get("/vendor/get");
export const fetchVendorById = (id: string | number) => apiInstance.get(`/vendor/${id}`);
export const updateVendor = (id: string | number, data: any) => apiInstance.put(`/vendor/${id}`, data);
export const deleteVendor = (id: string | number) => apiInstance.delete(`/vendor/${id}`);

// ==================== ITEM MASTER ====================
export const createItem = (data: any) => apiInstance.post("/items", data);
export const fetchItems = () => apiInstance.get("/items");
export const fetchItemById = (id: string | number) => apiInstance.get(`/items/${id}`);
export const updateItem = (id: string | number, data: any) => apiInstance.put(`/items/${id}`, data);
export const deleteItem = (id: string | number) => apiInstance.delete(`/items/${id}`);

// ==================== TRANSPORTATION MODE ====================
export const createTransportationMode = (data: any) => apiInstance.post("/transportation-modes", data);
export const fetchTransportationModes = () => apiInstance.get("/transportation-modes/get");
export const fetchTransportationModeById = (id: string | number) => apiInstance.get(`/transportation-modes/${id}`);
export const updateTransportationMode = (id: string | number, data: any) => apiInstance.put(`/transportation-modes/${id}`, data);
export const deleteTransportationMode = (id: string | number) => apiInstance.delete(`/transportation-modes/${id}`);