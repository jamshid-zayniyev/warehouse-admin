import { type NextRequest, NextResponse } from "next/server"
import type { SocialMedia, CreateSocialMedia } from "@/lib/types"

// Mock data - replace with actual database
const socialMediaData: SocialMedia[] = []

// GET /api/v1/social-media/{id}/ → SocialMedia (single)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const socialMedia = socialMediaData.find((item) => item.id === id)

    if (!socialMedia) {
      return NextResponse.json({ error: "Social media configuration not found" }, { status: 404 })
    }

    return NextResponse.json(socialMedia)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch social media configuration" }, { status: 500 })
  }
}

// PUT /api/v1/social-media/{id}/ → SocialMedia (update)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body: CreateSocialMedia = await request.json()

    const socialMediaIndex = socialMediaData.findIndex((item) => item.id === id)

    if (socialMediaIndex === -1) {
      return NextResponse.json({ error: "Social media configuration not found" }, { status: 404 })
    }

    // Optional fields validation
    const allowedFields: (keyof CreateSocialMedia)[] = ["telegram", "facebook", "x", "instagram", "youtube"]
    for (const field of allowedFields) {
      if (body[field] !== undefined && typeof body[field] !== "string") {
        return NextResponse.json({ error: `Invalid input for ${field}` }, { status: 400 })
      }
    }

    // Update the social media configuration
    socialMediaData[socialMediaIndex] = {
      ...socialMediaData[socialMediaIndex],
      ...body,
    }

    return NextResponse.json(socialMediaData[socialMediaIndex])
  } catch (error) {
    return NextResponse.json({ error: "Failed to update social media configuration" }, { status: 500 })
  }
}

// DELETE /api/v1/social-media/{id}/ → void (delete)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const socialMediaIndex = socialMediaData.findIndex((item) => item.id === id)

    if (socialMediaIndex === -1) {
      return NextResponse.json({ error: "Social media configuration not found" }, { status: 404 })
    }

    socialMediaData.splice(socialMediaIndex, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete social media configuration" }, { status: 500 })
  }
}
