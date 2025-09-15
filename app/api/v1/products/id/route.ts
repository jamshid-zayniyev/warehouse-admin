import { Product, CreateProduct } from "@/lib/types"
import { type NextRequest, NextResponse } from "next/server"

// Mock data - replace with actual database
const productData: Product[] = []

// ✅ GET /api/v1/products/{id}/ → Product (single)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const product = productData.find((item) => item.id === id)

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

// ✅ PUT /api/v1/products/{id}/ → Update product
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body: CreateProduct = await request.json()

    const productIndex = productData.findIndex((item) => item.id === id)

    if (productIndex === -1) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Basic validations
    if (typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }
    if (typeof body.description !== "string" || !body.description.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }
    if (!Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json({ error: "At least one image is required" }, { status: 400 })
    }

    // Update product
    productData[productIndex] = { ...productData[productIndex], ...body }

    return NextResponse.json(productData[productIndex])
  } catch (error) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

// ✅ DELETE /api/v1/products/{id}/ → Delete product
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const productIndex = productData.findIndex((item) => item.id === id)

    if (productIndex === -1) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    productData.splice(productIndex, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
