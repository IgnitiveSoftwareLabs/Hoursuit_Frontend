import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../customBaseQuery'; 
export const permissionApi = createApi({
  reducerPath: 'permissionApi',
  baseQuery: customBaseQuery,
  tagTypes: ['permission'],
  endpoints: (builder) => ({
    // Fetch all permission items
    getpermission: builder.query<any[], void>({
      query: () => '/permission/get',
      providesTags: ['permission'],
    }),

   

  }),
});

export const {
  useGetpermissionQuery,
} = permissionApi;
