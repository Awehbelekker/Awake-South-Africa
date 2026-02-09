import { NextRequest, NextResponse } from 'next/server'
import { updateTenantPackage } from '@/lib/master-admin/tenant-config'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add Master Admin authentication check
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { package: packageTier } = body

    if (!packageTier || !['basic', 'pro', 'enterprise', 'custom'].includes(packageTier)) {
      return NextResponse.json(
        { error: 'Invalid package tier' },
        { status: 400 }
      )
    }

    const result = await updateTenantPackage(params.id, packageTier)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update package' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update package:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

