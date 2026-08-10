import axios from "axios";
import { BASE_URL } from "../../utils/Base_Url";

const apiInstance = axios.create({
  // baseURL: "https://api-wms.ignitivelabs.in/api",
  baseURL: BASE_URL,
});

apiInstance.interceptors.request.use(
  (config) => {
    const getToken: string | null = localStorage.getItem("token");

    const token = getToken ? getToken : null;

    // Ensure headers exist before assigning Authorization
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error: any) => {
    return Promise.reject(error.message);
  }
);

apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 403) {
        try {
          const refreshToken: string | null =
            localStorage.getItem("refreshToken");
          const refreshResponse: any = await axios.post(
            `${BASE_URL}/api/user/refresh-token`,
            { refreshTokens: refreshToken } // Send refreshToken in the body
            // Ensure cookies are sent with the refresh request
          );
          console.log(refreshResponse, "refreshResponse");
          // Extract new tokens from the response
          if (refreshResponse.data.success && refreshResponse.data.result) {
            const { result, refreshToken } = refreshResponse.data;
            localStorage.setItem("token", result);
            localStorage.setItem("refreshToken", refreshToken);
            // Retry the original request with the new tokens
            error.config.headers["Authorization"] = `Bearer ${result}`;
            return axios(error.config);
          }
        } catch (refreshError) {
          // Clear cookies and redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          console.error("Refresh token error", refreshError);
          window.location.href = "/login"; // Redirect to login page

          throw refreshError;
        }
      } else if (status === 404) {
        console.error("Resource not found", error.response.data);
      } else if (status >= 500) {
        console.error("Server error", error.response.data);
      } else if (status === 401) {
        console.error("Unauthorized", error.response.data);
        window.location.href = "/login"; // Redirect to login page
      }
    } else if (error.request) {
      console.error("No response received", error.request);
    } else {
      console.error("Request setup error", error.message);
    }

    return Promise.reject(error);
  }
);
export default apiInstance;
