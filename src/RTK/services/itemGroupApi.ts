import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery';

interface ItemGroup {
  id: number;
  item_group_code: string;
  item_group_name: string;
  subsidiary_id?: number | null;
  CompanyId: number;
  user_id: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  subsidiary?: {
    id: number;
    subsidiary_name: string;
    subsidiary_code: string;
  };
}

interface ItemGroupResponse {
  message: string;
  success: boolean;
  result: ItemGroup[];
}

interface SingleItemGroupResponse {
  message: string;
  success: boolean;
  result: ItemGroup;
}

export const itemGroupApi = createApi({
  reducerPath: 'itemGroupApi',
  baseQuery: customBaseQuery,
  tagTypes: ['ItemGroup'],
  endpoints: (builder) => ({
    getItemGroups: builder.query<ItemGroupResponse, void>({
      query: () => '/item-group/get',
      providesTags: ['ItemGroup'],
    }),
    getItemGroupById: builder.query<SingleItemGroupResponse, string | number>({
      query: (id) => `/item-group/getsingle/${id}`,
      providesTags: (result, error, id) => [{ type: 'ItemGroup', id }],
    }),
    createItemGroup: builder.mutation<any, any>({
      query: (data) => ({
        url: '/item-group/create',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ItemGroup'],
    }),
    updateItemGroup: builder.mutation<any, { id: string | number; payload: any }>({
      query: ({ id, payload }) => ({
        url: `/item-group/update/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['ItemGroup'],
    }),
    deleteItemGroup: builder.mutation<any, string | number>({
      query: (id) => ({
        url: `/item-group/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ItemGroup'],
    }),
  }),
});

export const {
  useGetItemGroupsQuery,
  useGetItemGroupByIdQuery,
  useCreateItemGroupMutation,
  useUpdateItemGroupMutation,
  useDeleteItemGroupMutation,
} = itemGroupApi;