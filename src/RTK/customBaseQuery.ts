import {
  type BaseQueryFn,
  type FetchArgs,
  fetchBaseQuery,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { Mutex } from "async-mutex";
import { BASE_URL } from "../utils/Base_Url";

// Mutex to avoid multiple refresh token requests
const mutex = new Mutex();

const baseQuery = fetchBaseQuery({
  // baseUrl: "https://api-wms.ignitivelabs.in/api",
  baseUrl: `${BASE_URL}/api`,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const customBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  await mutex.waitForUnlock();

  let result = await baseQuery(args, api, extraOptions);

  if (
    result.error &&
    (result.error.status === 401 || result.error.status === 403)
  ) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          // No refresh token available, redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
          return result; // Return the original error
        }
        const refreshResponse = await fetch(
          // "http://localhost:8004/api/user/refresh-token",
          `${BASE_URL}/api/user/refresh-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshTokens: refreshToken }),
          }
        );

        const data = await refreshResponse.json();

        if (data.success && data.result) {
          localStorage.setItem("token", data.result);
          localStorage.setItem("refreshToken", data.refreshToken);

          // Retry the original query with the new token
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Redirect to login on failure
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }
      } finally {
        release();
      }
    } else {
      // Wait until the mutex is released before retrying
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export default customBaseQuery;
