import { Category, CreateCategory } from "@/lib/types"
import { type NextRequest, NextResponse } from "next/server"

// Mock data - replace with actual database


const categoryData: Category[] = []

// GET /api/v1/categories/{id}/ → Category (single)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const category = categoryData.find((item) => item.id === id)

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body: CreateCategory = await request.json()

    const categoryIndex = categoryData.findIndex((item) => item.id === id)

    if (categoryIndex === -1) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    if (typeof body.name_en !== "string" || !body.name_en.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (typeof body.slug !== "string" || !body.slug.trim()) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 })
    }
    if (typeof body.image !== "string" || !body.image.trim()) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    categoryData[categoryIndex] = { ...categoryData[categoryIndex], ...body }

    return NextResponse.json(categoryData[categoryIndex])
  } catch (error) {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const categoryIndex = categoryData.findIndex((item) => item.id === id)

    if (categoryIndex === -1) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    categoryData.splice(categoryIndex, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}
