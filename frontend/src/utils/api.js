const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Make an authenticated API call.
 * @param {string} path - API path (e.g., "/api/tasks")
 * @param {object} options - fetch options
 * @param {function} getToken - Clerk getToken function
 */
export async function apiCall(path, options = {}, getToken) {
  const token = await getToken();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}
