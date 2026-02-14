import { type NextRequest, NextResponse } from "next/server"
import type { CreateOurContact } from "@/lib/types"
import { apiFetch } from "@/lib/api"

// const API_BASE_URL = "https://api.dmx-group.uz/api/v1"

// ✅ GET /api/v1/about/our-contact/ → OurContact[] (list)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    const response = await apiFetch(`/about/our-contact/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }), // Auth header bor bo‘lsa qo‘shamiz
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch contact data")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch contact data" }, { status: 500 })
  }
}

// ✅ POST /api/v1/about/our-contact/ → OurContact (create)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const body: CreateOurContact = await request.json()

    // Optional: frontendda validatsiya qilish mumkin, lekin bu yerda API ga yuboramiz
    const response = await apiFetch(`/about/our-contact/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error("Failed to create contact information")
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create contact information" }, { status: 500 })
  }
}
