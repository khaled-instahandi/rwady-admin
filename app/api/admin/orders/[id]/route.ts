import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_BASE_URL = "https://backend.rwady.com/api"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      )
    }

    // Get auth token from cookies
    const cookieStore = cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Forward request to backend API
    const response = await fetch(`${API_BASE_URL}/admin/orders/${params.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Backend API error:", errorData)
      return NextResponse.json(
        { error: "Failed to update order status" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error("Error updating order status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
