import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

export interface InventoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  warehouseId?: string;
  clientId?: string;
  commodityId?: string;
  godownId?: string;
  stackId?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Inventory', 'Warehouse', 'Client', 'Commodity', 'Godown', 'Stack'],
  endpoints: (builder) => ({
    // Fetch inventory items with advanced filtering and pagination
    getInventory: builder.query<any, InventoryQueryParams>({
      query: ({ 
        page = 1, 
        limit = 10, 
        search = '',
        warehouseId,
        clientId,
        commodityId,
        godownId,
        stackId,
        sortBy,
        sortOrder
      }) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        
        if (search) params.set('search', search);
        if (warehouseId) params.set('warehouseId', warehouseId);
        if (clientId) params.set('clientId', clientId);
        if (commodityId) params.set('commodityId', commodityId);
        if (godownId) params.set('godownId', godownId);
        if (stackId) params.set('stackId', stackId);
        if (sortBy) params.set('sortBy', sortBy);
        if (sortOrder) params.set('sortOrder', sortOrder);

        return `/inventory/get?${params.toString()}`;
      },
      providesTags: ['Inventory'],
    }),

    // Fetch a single inventory item by ID
    getSingleInventory: builder.query<any, string | number>({
      query: (id) => `/inventory/getSingle/${id}`,
      providesTags: (_, __, id) => [{ type: 'Inventory', id }],
    }),

    // Additional endpoints for getting filter options
    getWarehouses: builder.query<any, void>({
      query: () => '/warehouse/get?limit=1000',
      transformResponse: (response: any) => response.result?.warehouses || response.result || [],
      providesTags: ['Warehouse'],
    }),

    getClients: builder.query<any, void>({
      query: () => '/customer/get?limit=1000',
      transformResponse: (response: any) => response.result?.customers || response.result || [],
      providesTags: ['Client'],
    }),

    getCommodities: builder.query<any, void>({
      query: () => '/commodity/get?limit=1000',
      transformResponse: (response: any) => response.result?.commodities || response.result || [],
      providesTags: ['Commodity'],
    }),

    getGodowns: builder.query<any, { warehouseId?: string }>({
      query: ({ warehouseId }) => {
        const params = warehouseId ? `?warehouseId=${warehouseId}` : '?limit=1000';
        return `/godown/get${params}`;
      },
      transformResponse: (response: any) => response.result?.godowns || response.result || [],
      providesTags: ['Godown'],
    }),

    getStacks: builder.query<any, { godownId?: string }>({
      query: ({ godownId }) => {
        const params = godownId ? `?godownId=${godownId}` : '?limit=1000';
        return `/stack/get${params}`;
      },
      transformResponse: (response: any) => response.result?.stacks || response.result || [],
      providesTags: ['Stack'],
    }),
  }),
});

export const {
  useGetInventoryQuery,
  useLazyGetInventoryQuery,
  useGetSingleInventoryQuery,
  useGetWarehousesQuery,
  useGetClientsQuery,
  useGetCommoditiesQuery,
  useGetGodownsQuery,
  useLazyGetGodownsQuery,
  useGetStacksQuery,
  useLazyGetStacksQuery,
} = inventoryApi;
