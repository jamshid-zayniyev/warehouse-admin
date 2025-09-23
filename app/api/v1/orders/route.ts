import { type NextRequest, NextResponse } from "next/server"
import type { Order, CreateOrder } from "@/lib/types"

const API_BASE_URL = "https://warehouseats.pythonanywhere.com/api/v1"

// GET all orders
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    const response = await fetch(`${API_BASE_URL}/order/all/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch orders")
    }

    const data: Order[] = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

// POST create a new order
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const body: CreateOrder = await request.json()

    const response = await fetch(`${API_BASE_URL}/order/create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error("Failed to create order")
    }

    const data: Order = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
