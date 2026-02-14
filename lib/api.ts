// services/api.ts
// export const API_BASE_URL = "https://backend.dmx-group.uz/api/v1";
export const API_BASE_URL = "https://backend.dmx-group.uz/api/v1/";

// https://backend.dmx-group.uz/api/swagger/



// umumiy wrapper
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
) {
  const lang = localStorage.getItem("lang") || "ru";

  // asosiy headerlar
  const defaultHeaders: HeadersInit = {
    "Accept-Language": lang,
  };

// Agar body FormData bo'lmasa va string emas bo'lsa → JSON qilib yuboramiz
if (options.body && !(options.body instanceof FormData) && typeof options.body !== "string") {
  defaultHeaders["Content-Type"] = "application/json";
  options.body = JSON.stringify(options.body);
}

  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  });
}
