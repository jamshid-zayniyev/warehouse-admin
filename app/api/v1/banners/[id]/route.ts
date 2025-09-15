import { type NextRequest, NextResponse } from "next/server"
import type { Banner, CreateBanner } from "@/lib/types"

// Mock data - replace with actual database
const bannerData: Banner[] = []

// GET /api/v1/banners/{id}/ → Banner (single)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const banner = bannerData.find((item) => item.id === id)

    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 })
    }

    return NextResponse.json(banner)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch banner" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body: CreateBanner = await request.json()

    const bannerIndex = bannerData.findIndex((item) => item.id === id)

    if (bannerIndex === -1) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 })
    }

    if (typeof body.image !== "string" || !body.image.trim()) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    bannerData[bannerIndex] = { ...bannerData[bannerIndex], ...body }

    return NextResponse.json(bannerData[bannerIndex])
  } catch (error) {
    return NextResponse.json({ error: "Failed to update banner" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const bannerIndex = bannerData.findIndex((item) => item.id === id)

    if (bannerIndex === -1) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 })
    }

    bannerData.splice(bannerIndex, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 })
  }
}
