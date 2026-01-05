/* global window, fetch */
(() => {
  const API_BASE = "/api";

  const safeJson = async (response) => {
    try {
      return await response.json();
    } catch (error) {
      return null;
    }
  };

  const buildError = (response, payload) => {
    const result = payload?.result || payload || {};
    return {
      status: response.status,
      message: result.message || response.statusText || "Request failed",
      validationErrors: result.validationErrors || null,
      payload,
    };
  };

  const request = async (path, options = {}) => {
    const { method = "GET", body, headers = {} } = options;
    const config = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const authHeader = window.AtencyAuth?.getAuthHeader?.();
    if (authHeader) {
      config.headers.Authorization = authHeader;
    }

    if (body !== undefined) {
      config.body = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, config);
    } catch (error) {
      throw {
        status: 0,
        message: "Network error. Please try again.",
        validationErrors: null,
        payload: null,
      };
    }

    const payload = await safeJson(response);

    if (!response.ok) {
      throw buildError(response, payload);
    }

    return payload?.result ?? payload;
  };

  const login = (payload) => request("/auth/login", { method: "POST", body: payload });
  const register = (payload) => request("/auth/register", { method: "POST", body: payload });

  const getSummary = () => request("/attendance/my-summary");
  const getMyRecords = () => request("/attendance/my-records");
  const checkIn = () => request("/attendance/check-in", { method: "POST", body: {} });
  const checkOut = () => request("/attendance/check-out", { method: "POST", body: {} });

  const getAllAttendance = () => request("/admin/attendance/all");
  const getAttendanceByUser = (userId) => request(`/admin/attendance/${userId}`);

  window.AtencyAPI = {
    request,
    login,
    register,
    getSummary,
    getMyRecords,
    checkIn,
    checkOut,
    getAllAttendance,
    getAttendanceByUser,
  };
})();
