import { type NextRequest, NextResponse } from "next/server"
import type { News, CreateNews } from "@/lib/types"
import { apiFetch } from "@/lib/api"

const API_BASE_URL = "https://uzbekfoodstuff.pythonanywhere.com/api/v1"

// GET /api/v1/news/ → News[] (list)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    const response = await apiFetch(`/about/news/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch news data")
    }

    const data: News[] = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch news data" }, { status: 500 })
  }
}

// POST /api/v1/news/ → News (create)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const body: CreateNews = await request.json()

    const response = await apiFetch(`/about/news/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error("Failed to create news article")
    }

    const data: News = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create news article" }, { status: 500 })
  }
}
