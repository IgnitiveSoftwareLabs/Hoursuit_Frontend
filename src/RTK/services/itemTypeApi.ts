import { createApi } from "@reduxjs/toolkit/query/react";
import customBaseQuery from "../customBaseQuery";

export interface ItemTypeType {
    id?: number;
    item_type_name: string;
    description?: string | null;
    isActive?: boolean;
    user_id?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ItemTypeResponse {
    message: string;
    result: ItemTypeType[];
    totalRecords?: number;
}

export interface SingleItemTypeResponse {
    message: string;
    result: ItemTypeType;
}

export const itemTypeApi = createApi({
    reducerPath: "itemTypeApi",
    baseQuery: customBaseQuery,
    tagTypes: ["ItemType"],
    endpoints: (builder) => ({
        getItemTypes: builder.query<ItemTypeResponse, void>({
            query: () => "/platform/item-types",
            providesTags: ["ItemType"],
        }),
        getSingleItemType: builder.query<SingleItemTypeResponse, number>({
            query: (id) => `/platform/item-types/${id}`,
            providesTags: (_, __, id) => [{ type: "ItemType", id }],
        }),
        createItemType: builder.mutation<
            SingleItemTypeResponse,
            Partial<ItemTypeType>
        >({
            query: (payload) => ({
                url: "/platform/item-types",
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["ItemType"],
        }),
        updateItemType: builder.mutation<
            SingleItemTypeResponse,
            { id: number; payload: Partial<ItemTypeType> }
        >({
            query: ({ id, payload }) => ({
                url: `/platform/item-types/${id}`,
                method: "PUT",
                body: payload,
            }),
            invalidatesTags: (_, __, { id }) => [
                { type: "ItemType", id },
                "ItemType",
            ],
        }),
        deleteItemType: builder.mutation<{ message: string }, number>({
            query: (id) => ({ url: `/platform/item-types/${id}`, method: "DELETE" }),
            invalidatesTags: ["ItemType"],
        }),
    }),
});

export const {
    useGetItemTypesQuery,
    useGetSingleItemTypeQuery,
    useCreateItemTypeMutation,
    useUpdateItemTypeMutation,
    useDeleteItemTypeMutation,
} = itemTypeApi;
