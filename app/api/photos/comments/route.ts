import { type NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

// POST - Add a comment
export async function POST(request: NextRequest) {
  try {
    const { photoId, userId, userName, content } = await request.json()

    if (!photoId || !userId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await pool.query(
      'INSERT INTO photo_comments (photo_id, user_id, user_name, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [photoId, userId, userName || 'Anonymous', content]
    )

    return NextResponse.json({ 
      comment: {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        userName: result.rows[0].user_name,
        content: result.rows[0].content,
        createdAt: result.rows[0].created_at
      }
    })
  } catch (error) {
    console.error('Comment error:', error)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}

// DELETE - Delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const { commentId, userId } = await request.json()

    if (!commentId) {
      return NextResponse.json({ error: 'Missing commentId' }, { status: 400 })
    }

    // Only allow deleting own comments
    await pool.query(
      'DELETE FROM photo_comments WHERE id = $1 AND user_id = $2',
      [commentId, userId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete comment error:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
