// src/services/leaveService.ts
import { getToken } from "./authService";

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://192.168.137.1:8000";

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_HOST}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

// Get all leave requests
export function getLeaveRequests() {
  return request("/api/leave-request", { method: "GET" });
}

// Create new leave request
export function createLeaveRequest(payload: {
  leave_type: string;
  subject: string;
  leave_date: string[];
  approval_user: string;
  reason: string;
  location_during_leave: string;
  return_to_office: string;
  ongoing_task: string;
  temporary_replacement: string;
  phone_number: string;
}) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => formData.append(`${key}[]`, v));
    } else {
      formData.append(key, value);
    }
  });

  return request("/api/leave-request", {
    method: "POST",
    body: formData,
  });
}

// Dropdown: leave types
export function getLeaveTypes() {
  return request("/api/dropdown/leave-types", { method: "GET" });
}

// Dropdown: users (approval user)
export function getUsers() {
  return request("/api/dropdown/users", { method: "GET" });
}

// Get logged-in user detail
export function getUserProfile() {
  return request("/api/user", { method: "GET" });
}
