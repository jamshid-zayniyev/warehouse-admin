import { apiFetch } from "./api"

interface LoginResponse {
  success: boolean
  status_code: number
  role:string
  message: string
  data: {
    refresh: string
    access: string
  }
}

interface LoginCredentials {
  phone_number: string
  password: string
}

const API_BASE_URL = "https://warehouseats.pythonanywhere.com/api/v1"

export class AuthService {
  private static instance: AuthService

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/user/admin/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error("Login failed")
    }

    const data: LoginResponse = await response.json()

    if (data.success) {
      // Store tokens in localStorage
      localStorage.setItem("access_token", data.data.access)
      localStorage.setItem("refresh_token", data.data.refresh)
      localStorage.setItem("role", data.role)
    }

    return data
  }

  logout(): void {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("role")
  }

  getAccessToken(): string | null {
    return localStorage.getItem("access_token")
  }

  getRefreshToken(): string | null {
    return localStorage.getItem("refresh_token")
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  }

  
  async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const lang = localStorage.getItem("lang") || "ru";
  const token = this.getAccessToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
    "Accept-Language": lang, // <-- Bu qator qo'shildi
    ...options.headers,
  };

  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
}
}

export const authService = AuthService.getInstance()




