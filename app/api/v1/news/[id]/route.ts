import { type NextRequest, NextResponse } from "next/server"
import type { News, CreateNews } from "@/lib/types"

// Mock data - replace with actual database
const newsData: News[] = [
  {
    id: 1,
    title: "Revolutionary AI Technology Launched",
    description:
      "We are excited to announce the launch of our groundbreaking AI technology that will transform how businesses operate. This innovative solution combines machine learning with advanced analytics to provide unprecedented insights and automation capabilities.",
    type: "t",
    images: [
      { id: 1, image: "/ai-technology-launch.png", news: 1 },
      { id: 2, image: "/ai-dashboard-preview.png", news: 1 },
    ],
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    title: "Company Expands to European Markets",
    description:
      "Following our successful growth in North America, we are thrilled to announce our expansion into European markets. This strategic move will allow us to serve customers across the EU with localized support and services.",
    type: "c",
    images: [{ id: 3, image: "/european-expansion.png", news: 2 }],
    created_at: "2024-01-14T14:22:00Z",
  },
  {
    id: 3,
    title: "Customer Success Story: 300% Growth",
    description:
      "Learn how TechCorp achieved remarkable 300% growth in just 6 months using our platform. This inspiring story showcases the real-world impact of our solutions on business transformation and success.",
    type: "s",
    images: [
      { id: 4, image: "/success-story-chart.png", news: 3 },
      { id: 5, image: "/customer-testimonial.png", news: 3 },
    ],
    created_at: "2024-01-13T09:15:00Z",
  },
]

// GET /api/v1/news/{id}/ → News (single)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const news = newsData.find((item) => item.id === id)

    if (!news) {
      return NextResponse.json({ error: "News article not found" }, { status: 404 })
    }

    return NextResponse.json(news)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch news article" }, { status: 500 })
  }
}

// PUT /api/v1/news/{id}/ → News (update)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body: CreateNews = await request.json()

    const newsIndex = newsData.findIndex((item) => item.id === id)

    if (newsIndex === -1) {
      return NextResponse.json({ error: "News article not found" }, { status: 404 })
    }

    // Validate required fields
    if (
      typeof body.title !== "string" ||
      !body.title.trim() ||
      typeof body.description !== "string" ||
      !body.description.trim() ||
      typeof body.type !== "string" ||
      !["p", "s", "c", "t"].includes(body.type)
    ) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 })
    }

    // Update news but preserve created_at and images
    newsData[newsIndex] = {
      ...newsData[newsIndex],
      ...body,
    }

    return NextResponse.json(newsData[newsIndex])
  } catch (error) {
    return NextResponse.json({ error: "Failed to update news article" }, { status: 500 })
  }
}

// DELETE /api/v1/news/{id}/ → void (delete)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const newsIndex = newsData.findIndex((item) => item.id === id)

    if (newsIndex === -1) {
      return NextResponse.json({ error: "News article not found" }, { status: 404 })
    }

    newsData.splice(newsIndex, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete news article" }, { status: 500 })
  }
}
