import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = "https://backend.rwady.com/api"

// GET /api/notifications - Get all notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const per_page = parseInt(searchParams.get("per_page") || "20")
    
    try {
      const response = await fetch(`${API_BASE_URL}/general/notifications?page=${page}&per_page=${per_page}`, {
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
    } catch (apiError) {
      // If API fails, return mock data
      console.log("API not available, using mock data")
      
  
      
    }
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
