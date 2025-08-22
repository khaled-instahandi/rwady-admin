import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = "https://backend.rwady.com/api"

// PUT /api/notifications/[id]/read - Mark notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    try {
      const response = await fetch(`${API_BASE_URL}/general/notifications/${id}/read`, {
        method: "PUT",
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
    } catch (apiError) {
      // If API fails, simulate success response
      console.log("API not available, simulating mark as read")





    }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json(
      { error: "Failed to mark notification as read", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
