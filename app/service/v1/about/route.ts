import { type NextRequest, NextResponse } from "next/server"
import type { CreateAbout } from "@/lib/types"
import { apiFetch } from "@/lib/api"


// GET /api/v1/about/ → About[] (list)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    const response = await apiFetch(`/about/`, {
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

// POST /api/v1/about/ → About (create)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const body: CreateAbout = await request.json()

    const response = await apiFetch(`/about/`, {
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
