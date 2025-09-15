import { type NextRequest, NextResponse } from "next/server"
import type { Contact, CreateContact } from "@/lib/types"
import { apiFetch } from "@/lib/api"

const API_BASE_URL = "https://your-api.com/api/v1"

// GET /api/v1/contact/{id}/ → Contact (single)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const res = await apiFetch(`/about/contact/${id}`)
    if (!res.ok) return NextResponse.json({ error: "Contact message not found" }, { status: res.status })
    const contact: Contact = await res.json()
    return NextResponse.json(contact)
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch contact message" }, { status: 500 })
  }
}

// PUT /api/v1/contact/{id}/ → Contact (update)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body: CreateContact = await request.json()

    // Basic validation
    if (!body.first_name?.trim() || !body.email?.trim() || !body.theme?.trim() || !body.message?.trim()) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) return NextResponse.json({ error: "Invalid email format" }, { status: 400 })

    const res = await apiFetch(`/about/contact/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) return NextResponse.json({ error: "Failed to update contact message" }, { status: res.status })

    const updatedContact: Contact = await res.json()
    return NextResponse.json(updatedContact)
  } catch (err) {
    return NextResponse.json({ error: "Failed to update contact message" }, { status: 500 })
  }
}

// DELETE /api/v1/contact/{id}/ → void (delete)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const res = await apiFetch(`/about/contact/${id}`, { method: "DELETE" })
    if (!res.ok) return NextResponse.json({ error: "Failed to delete contact message" }, { status: res.status })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete contact message" }, { status: 500 })
  }
}
