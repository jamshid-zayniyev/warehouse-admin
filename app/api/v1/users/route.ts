import { type NextRequest, NextResponse } from "next/server"
import type { User, UpdateUser } from "@/lib/types"
import { apiFetch } from "@/lib/api"

const API_BASE_URL = "https://warehouseats.pythonanywhere.com/api/v1/user/me"
const API_EDIT_URL = "https://warehouseats.pythonanywhere.com/api/v1/user/me-edit/"

// GET /api/user/me → User (current user profile)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    const res = await apiFetch('/user/me', {
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    })
    if (!res.ok) return NextResponse.json({ error: "User profile not found" }, { status: res.status })
    const user: User = await res.json()
    return NextResponse.json(user)
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
  }
}

// PUT /api/user/me → User (update current user profile)
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const body: UpdateUser = await request.json()

    // Basic validation
    if (body.full_name && !body.full_name.trim()) {
      return NextResponse.json({ error: "Full name cannot be empty" }, { status: 400 })
    }

    if (body.phone_number && !body.phone_number.trim()) {
      return NextResponse.json({ error: "Phone number cannot be empty" }, { status: 400 })
    }

    // Phone number format validation (basic)
    if (body.phone_number) {
      const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(body.phone_number.replace(/\s/g, ""))) {
        return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
      }
    }

    const res = await apiFetch('/user/me-edit/', {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) return NextResponse.json({ error: "Failed to update user profile" }, { status: res.status })

    const updatedUser: User = await res.json()
    return NextResponse.json(updatedUser)
  } catch (err) {
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
  }
}
