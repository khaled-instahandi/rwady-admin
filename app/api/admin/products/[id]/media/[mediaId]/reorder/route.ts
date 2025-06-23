import { NextRequest, NextResponse } from 'next/server'
import { apiService } from '@/lib/api'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; mediaId: string } }
) {
  try {
    const { orders } = await request.json()
    const { id: productId, mediaId } = params

    if (!orders || typeof orders !== 'number') {
      return NextResponse.json(
        { success: false, message: 'Invalid orders parameter' },
        { status: 400 }
      )
    }

    // Make API call to backend to reorder media
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${productId}/media/${mediaId}/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_TOKEN}`, // You might need to get this from cookies/session
      },
      body: JSON.stringify({ orders })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to reorder media' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'Media reordered successfully',
      data
    })

  } catch (error) {
    console.error('Error reordering media:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
