/* global window, localStorage */
(() => {
  const TOKEN_KEY = "atency_token";
  const TOKEN_TYPE_KEY = "atency_token_type";
  const USER_KEY = "atency_user";

  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const getTokenType = () => localStorage.getItem(TOKEN_TYPE_KEY) || "Bearer";

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch (error) {
      return null;
    }
  };

  const setSession = (authResponse) => {
    if (!authResponse) return;
    localStorage.setItem(TOKEN_KEY, authResponse.accessToken);
    localStorage.setItem(TOKEN_TYPE_KEY, authResponse.tokenType || "Bearer");
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        username: authResponse.username,
        role: authResponse.role,
      })
    );
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_TYPE_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const isAuthenticated = () => Boolean(getToken());

  const getAuthHeader = () => {
    const token = getToken();
    if (!token) return null;
    return `${getTokenType()} ${token}`;
  };

  const login = async (payload) => {
    if (!window.AtencyAPI?.login) {
      throw new Error("API client not available");
    }
    const response = await window.AtencyAPI.login(payload);
    setSession(response);
    return response;
  };

  const register = async (payload) => {
    if (!window.AtencyAPI?.register) {
      throw new Error("API client not available");
    }
    return window.AtencyAPI.register(payload);
  };

  const logout = (redirect = true) => {
    clearSession();
    if (redirect) {
      window.location.href = "login.html";
    }
  };

  const requireAuth = (requiredRole) => {
    if (!isAuthenticated()) {
      window.location.href = "login.html";
      return false;
    }

    if (requiredRole) {
      const user = getUser();
      if (!user || user.role !== requiredRole) {
        window.location.href = "dashboard.html";
        return false;
      }
    }

    return true;
  };

  const redirectIfAuthenticated = () => {
    if (isAuthenticated()) {
      window.location.href = "dashboard.html";
      return true;
    }
    return false;
  };

  window.AtencyAuth = {
    getToken,
    getTokenType,
    getUser,
    setSession,
    clearSession,
    isAuthenticated,
    getAuthHeader,
    login,
    register,
    logout,
    requireAuth,
    redirectIfAuthenticated,
  };
})();
