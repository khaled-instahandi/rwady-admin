import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = "https://rwady-backend.ahmed-albakor.com/api"

// GET /api/admin/settings - Get all settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") || "1"
    const per_page = searchParams.get("per_page") || "1000"
    
    const response = await fetch(`${API_BASE_URL}/admin/settings?page=${page}&per_page=${per_page}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        // Add authorization header if needed
        // "Authorization": `Bearer ${token}`
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// POST /api/admin/settings - Create new setting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${API_BASE_URL}/admin/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        // Add authorization header if needed
        // "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating setting:", error)
    return NextResponse.json(
      { error: "Failed to create setting", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/settings - Bulk update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${API_BASE_URL}/admin/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        // Add authorization header if needed
        // "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Failed to update settings", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
