// Traccar API Proxy - handles authentication server-side to avoid CORS issues
import type { VercelRequest, VercelResponse } from '@vercel/node'

const TRACCAR_SERVER = 'https://server.traccar.org'
const TRACCAR_API = `${TRACCAR_SERVER}/api`
const TRACCAR_EMAIL = process.env.TRACCAR_EMAIL || 'abribooysen@gmail.com'
const TRACCAR_PASSWORD = process.env.TRACCAR_PASSWORD || 'fyjndjcu'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { driverIds } = req.body as { driverIds: string[] }

    if (!driverIds || !Array.isArray(driverIds)) {
      return res.status(400).json({ error: 'driverIds array required' })
    }

    // Create session
    const sessionResponse = await fetch(`${TRACCAR_API}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: TRACCAR_EMAIL,
        password: TRACCAR_PASSWORD,
      }),
    })

    if (!sessionResponse.ok) {
      console.error('Session creation failed:', sessionResponse.status)
      return res.status(401).json({ error: 'Failed to authenticate with Traccar' })
    }

    // Extract session cookie
    const cookies = sessionResponse.headers.get('set-cookie')
    if (!cookies) {
      return res.status(500).json({ error: 'No session cookie received' })
    }

    // Fetch devices
    const devicesResponse = await fetch(`${TRACCAR_API}/devices`, {
      headers: {
        Cookie: cookies,
      },
    })

    if (!devicesResponse.ok) {
      console.error('Devices fetch failed:', devicesResponse.status)
      return res.status(500).json({ error: 'Failed to fetch devices' })
    }

    const allDevices = await devicesResponse.json()

    // Filter to only our driver IDs
    const ourDevices = allDevices.filter((d: any) => driverIds.includes(d.uniqueId))

    if (ourDevices.length === 0) {
      return res.status(200).json({})
    }

    // Fetch positions
    const positionsResponse = await fetch(`${TRACCAR_API}/positions`, {
      headers: {
        Cookie: cookies,
      },
    })

    if (!positionsResponse.ok) {
      console.error('Positions fetch failed:', positionsResponse.status)
      return res.status(500).json({ error: 'Failed to fetch positions' })
    }

    const allPositions = await positionsResponse.json()

    // Map positions by uniqueId
    const positionsByDriverId: Record<string, any> = {}

    for (const device of ourDevices) {
      const position = allPositions.find((p: any) => p.deviceId === device.id)
      if (position) {
        positionsByDriverId[device.uniqueId] = position
      }
    }

    return res.status(200).json(positionsByDriverId)
  } catch (error) {
    console.error('Traccar proxy error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
