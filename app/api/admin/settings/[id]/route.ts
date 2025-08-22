import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = "https://backend.rwady.com/api"

// PUT /api/admin/settings/[id] - Update single setting by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { id } = params
    
    const response = await fetch(`${API_BASE_URL}/admin/settings/${id}`, {
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
    console.error("Error updating setting:", error)
    return NextResponse.json(
      { error: "Failed to update setting", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/settings/[id] - Delete setting by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const response = await fetch(`${API_BASE_URL}/admin/settings/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        // Add authorization header if needed
        // "Authorization": `Bearer ${token}`
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error deleting setting:", error)
    return NextResponse.json(
      { error: "Failed to delete setting", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// GET /api/admin/settings/[id] - Get single setting by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const response = await fetch(`${API_BASE_URL}/admin/settings/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        // Add authorization header if needed
        // "Authorization": `Bearer ${token}`
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching setting:", error)
    return NextResponse.json(
      { error: "Failed to fetch setting", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
