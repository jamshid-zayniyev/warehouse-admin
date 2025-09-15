import { type NextRequest, NextResponse } from "next/server"
import type { About, CreateAbout } from "@/lib/types"

// Mock data - replace with actual database
const aboutData: About[] = []

// GET /api/v1/about/{id}/ → About (single)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const about = aboutData.find((item) => item.id === id)

    if (!about) {
      return NextResponse.json({ error: "About section not found" }, { status: 404 })
    }

    return NextResponse.json(about)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch about section" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body: CreateAbout = await request.json()

    const aboutIndex = aboutData.findIndex((item) => item.id === id)

    if (aboutIndex === -1) {
      return NextResponse.json({ error: "About section not found" }, { status: 404 })
    }

    if (
      typeof body.happy_clients !== "number" ||
      typeof body.product_type !== "number" ||
      typeof body.experience !== "number"
    ) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 })
    }

    aboutData[aboutIndex] = { ...aboutData[aboutIndex], ...body }

    return NextResponse.json(aboutData[aboutIndex])
  } catch (error) {
    return NextResponse.json({ error: "Failed to update about section" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const aboutIndex = aboutData.findIndex((item) => item.id === id)

    if (aboutIndex === -1) {
      return NextResponse.json({ error: "About section not found" }, { status: 404 })
    }

    aboutData.splice(aboutIndex, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete about section" }, { status: 500 })
  }
}
