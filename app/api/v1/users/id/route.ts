import { type NextRequest, NextResponse } from "next/server"
import type { User, UpdateUser } from "@/lib/types"
import { apiFetch } from "@/lib/api"

const API_BASE_URL = "https://uzbekfoodstuff.pythonanywhere.com/api/v1/user/me/"
const API_EDIT_URL = "https://uzbekfoodstuff.pythonanywhere.com/api/v1/user/me-edit/"
const API_DELETE_URL = "https://uzbekfoodstuff.pythonanywhere.com/api/v1/user/delete-account/"

// 🔹 GET /api/user/me → Get current user profile
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    const res = await apiFetch('/user/me/', {
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: "User profile not found" }, { status: res.status })
    }

    const user: User = await res.json()
    return NextResponse.json(user)
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
  }
}

// 🔹 PUT /api/user/me → Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const body: UpdateUser = await request.json()

    // ✅ Validation (optional)
    if (body.full_name && !body.full_name.trim()) {
      return NextResponse.json({ error: "Full name cannot be empty" }, { status: 400 })
    }

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

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to update user profile" }, { status: res.status })
    }

    const updatedUser: User = await res.json()
    return NextResponse.json(updatedUser)
  } catch (err) {
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
  }
}

// 🔹 DELETE /api/user/me → Delete current user account
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    const res = await apiFetch('/user/delete-account/', {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to delete user account" }, { status: res.status })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete user account" }, { status: 500 })
  }
}
