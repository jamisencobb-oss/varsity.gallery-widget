import { type NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

// POST - Like a photo
export async function POST(request: NextRequest) {
  try {
    const { photoId, userId } = await request.json()

    if (!photoId || !userId) {
      return NextResponse.json({ error: 'Missing photoId or userId' }, { status: 400 })
    }

    // Insert like (ignore if already exists)
    await pool.query(
      'INSERT INTO photo_likes (photo_id, user_id) VALUES ($1, $2) ON CONFLICT (photo_id, user_id) DO NOTHING',
      [photoId, userId]
    )

    // Get updated like count
    const result = await pool.query(
      'SELECT COUNT(*)::int as count FROM photo_likes WHERE photo_id = $1',
      [photoId]
    )

    return NextResponse.json({ likeCount: result.rows[0].count })
  } catch (error) {
    console.error('Like error:', error)
    return NextResponse.json({ error: 'Failed to like photo' }, { status: 500 })
  }
}

// DELETE - Unlike a photo
export async function DELETE(request: NextRequest) {
  try {
    const { photoId, userId } = await request.json()

    if (!photoId || !userId) {
      return NextResponse.json({ error: 'Missing photoId or userId' }, { status: 400 })
    }

    await pool.query(
      'DELETE FROM photo_likes WHERE photo_id = $1 AND user_id = $2',
      [photoId, userId]
    )

    // Get updated like count
    const result = await pool.query(
      'SELECT COUNT(*)::int as count FROM photo_likes WHERE photo_id = $1',
      [photoId]
    )

    return NextResponse.json({ likeCount: result.rows[0].count })
  } catch (error) {
    console.error('Unlike error:', error)
    return NextResponse.json({ error: 'Failed to unlike photo' }, { status: 500 })
  }
}

// GET - Check if user liked a photo
export async function GET(request: NextRequest) {
  const photoId = request.nextUrl.searchParams.get('photoId')
  const userId = request.nextUrl.searchParams.get('userId')

  if (!photoId || !userId) {
    return NextResponse.json({ error: 'Missing photoId or userId' }, { status: 400 })
  }

  try {
    const result = await pool.query(
      'SELECT 1 FROM photo_likes WHERE photo_id = $1 AND user_id = $2',
      [photoId, userId]
    )

    return NextResponse.json({ liked: result.rows.length > 0 })
  } catch (error) {
    console.error('Check like error:', error)
    return NextResponse.json({ error: 'Failed to check like' }, { status: 500 })
  }
}
