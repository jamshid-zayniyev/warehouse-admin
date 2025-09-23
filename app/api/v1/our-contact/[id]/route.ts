import { type NextRequest, NextResponse } from "next/server"
import type { CreateOurContact } from "@/lib/types"
import { apiFetch } from "@/lib/api"

const API_BASE_URL = "https://warehouseats.pythonanywhere.com/api/v1"

// ✅ GET /api/v1/about/our-contact/{id}/ → OurContact (single)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    const { id } = params

    const response = await apiFetch(`/about/our-contact/${id}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Contact information not found" }, { status: 404 })
      }
      throw new Error("Failed to fetch contact information")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch contact information" }, { status: 500 })
  }
}

// ✅ PUT /api/v1/about/our-contact/{id}/ → OurContact (update)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    const { id } = params
    const body: CreateOurContact = await request.json()

    const response = await apiFetch(`/about/our-contact/${id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Contact information not found" }, { status: 404 })
      }
      throw new Error("Failed to update contact information")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update contact information" }, { status: 500 })
  }
}

// ✅ DELETE /api/v1/about/our-contact/{id}/ → void (delete)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    const { id } = params

    const response = await apiFetch(`/about/our-contact/${id}/`, {
      method: "DELETE",
      headers: {
        ...(authHeader && { Authorization: authHeader }),
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Contact information not found" }, { status: 404 })
      }
      throw new Error("Failed to delete contact information")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete contact information" }, { status: 500 })
  }
}
