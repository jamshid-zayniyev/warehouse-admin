import { type NextRequest, NextResponse } from "next/server"
import type { Banner, CreateBanner } from "@/lib/types"
import { apiFetch } from "@/lib/api"

const API_BASE_URL = "https://warehouseats.pythonanywhere.com/api/v1"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    const response = await apiFetch(`/about/banners/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch about data")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch about data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const body: CreateBanner = await request.json()

    const response = await apiFetch(`/about/banners/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error("Failed to create about section")
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create about section" }, { status: 500 })
  }
}
