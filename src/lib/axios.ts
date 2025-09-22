import { environment } from "@/configs/envorinment";
import useCookies from "@/hooks/use-cookies";
import axios from "axios";

const header = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

const instance = axios.create({
  baseURL: environment.API_HOST,
  headers: header,
  withXSRFToken: true,
  timeout: 60 * 1000,
});

instance.interceptors.request.use(
  async (request) => {
    const { token } = await useCookies();

    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
    }
    return request;
  },

  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    throw Error(error);
  }
);

export default instance;
