import { type NextRequest, NextResponse } from "next/server"
import type { Contact, CreateContact } from "@/lib/types"

// Mock data - replace with actual database
const contactData: Contact[] = []

// GET /api/v1/contact/{id}/ → Contact (single)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const contact = contactData.find((c) => c.id === id)

    if (!contact) {
      return NextResponse.json({ error: "Contact message not found" }, { status: 404 })
    }

    return NextResponse.json(contact)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch contact message" }, { status: 500 })
  }
}

// PUT /api/v1/contact/{id}/ → Contact (update)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const body: CreateContact = await request.json()
    const contactIndex = contactData.findIndex((c) => c.id === id)

    if (contactIndex === -1) {
      return NextResponse.json({ error: "Contact message not found" }, { status: 404 })
    }

    // Validate required fields
    if (
      typeof body.first_name !== "string" ||
      !body.first_name.trim() ||
      typeof body.email !== "string" ||
      !body.email.trim() ||
      typeof body.theme !== "string" ||
      !body.theme.trim() ||
      typeof body.message !== "string" ||
      !body.message.trim()
    ) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Update contact but preserve created_at
    contactData[contactIndex] = { ...contactData[contactIndex], ...body }

    return NextResponse.json(contactData[contactIndex])
  } catch (error) {
    return NextResponse.json({ error: "Failed to update contact message" }, { status: 500 })
  }
}

// DELETE /api/v1/contact/{id}/ → void (delete)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    const contactIndex = contactData.findIndex((c) => c.id === id)

    if (contactIndex === -1) {
      return NextResponse.json({ error: "Contact message not found" }, { status: 404 })
    }

    contactData.splice(contactIndex, 1)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete contact message" }, { status: 500 })
  }
}
