import { type NextRequest, NextResponse } from "next/server"
import type { SocialMedia, CreateSocialMedia } from "@/lib/types"
import { apiFetch } from "@/lib/api"

const API_BASE_URL = "https://warehouseats.pythonanywhere.com/api/v1"

// GET /api/v1/social-media/ → SocialMedia[] (list)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    const response = await apiFetch(`/about/social-media/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch social media data")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch social media data" }, { status: 500 })
  }
}

// POST /api/v1/social-media/ → SocialMedia (create)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const body: CreateSocialMedia = await request.json()

    const response = await apiFetch(`/about/social-media/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error("Failed to create social media configuration")
    }

    const data: SocialMedia = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create social media configuration" }, { status: 500 })
  }
}
