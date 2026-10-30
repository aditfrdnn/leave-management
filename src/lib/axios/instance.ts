import axios from "axios";

import { environment } from "@/configs/environment";
import { getRequestLocale, getTokenCookie } from "../cookies";

const header = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

/** In the browser the root layout's `<html lang>` already holds the UI language, saving a server round trip. */
async function getLocale() {
  if (typeof document !== "undefined") return document.documentElement.lang;
  return getRequestLocale();
}

/** The only Axios instance in the app (RULES §6). Services call it; nothing else does. */
const instance = axios.create({
  baseURL: environment.DEV_URL || environment.PROD_URL,
  headers: header,
  withCredentials: true,
  timeout: 60 * 1000,
});

instance.interceptors.request.use(
  async (request) => {
    const [token, locale] = await Promise.all([getTokenCookie(), getLocale()]);

    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
    }

    // Lets the API answer in the user's language once it supports it (docs/backend-task.md).
    if (locale) {
      request.headers["X-Locale"] = locale;
    }

    return request;
  },
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

export default instance;
