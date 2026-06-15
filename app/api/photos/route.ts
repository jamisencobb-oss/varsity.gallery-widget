import { put, del } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

// GET - List all photos
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        COALESCE(
          (SELECT COUNT(*) FROM photo_likes WHERE photo_id = p.id),
          0
        )::int as like_count,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', c.id,
            'userId', c.user_id,
            'userName', c.user_name,
            'content', c.content,
            'createdAt', c.created_at
          ) ORDER BY c.created_at DESC)
          FROM photo_comments c WHERE c.photo_id = p.id),
          '[]'
        ) as comments
      FROM photos p
      ORDER BY p.created_at DESC
    `)
    
    return NextResponse.json({ photos: result.rows })
  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 })
  }
}

// POST - Upload a new photo
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const caption = formData.get('caption') as string || ''

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`photos/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })

    // Save to database
    const result = await pool.query(
      'INSERT INTO photos (url, caption) VALUES ($1, $2) RETURNING *',
      [blob.url, caption]
    )

    return NextResponse.json({ photo: result.rows[0] })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// DELETE - Delete a photo
export async function DELETE(request: NextRequest) {
  try {
    const { id, url } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'No photo ID provided' }, { status: 400 })
    }

    // Delete from database (cascade deletes likes and comments)
    await pool.query('DELETE FROM photos WHERE id = $1', [id])

    // Delete from Vercel Blob
    if (url) {
      await del(url)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}

// PATCH - Update photo caption
export async function PATCH(request: NextRequest) {
  try {
    const { id, caption } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'No photo ID provided' }, { status: 400 })
    }

    const result = await pool.query(
      'UPDATE photos SET caption = $1 WHERE id = $2 RETURNING *',
      [caption, id]
    )

    return NextResponse.json({ photo: result.rows[0] })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
