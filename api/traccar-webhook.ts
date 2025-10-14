import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Traccar sends location data in OsmAnd format
interface TraccarLocation {
  lat: number
  lon: number
  timestamp?: number
  speed?: number
  bearing?: number
  altitude?: number
  accuracy?: number
  deviceid?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Traccar sends data as query parameters (OsmAnd protocol)
    const {
      lat,
      lon,
      timestamp,
      speed,
      bearing,
      altitude,
      accuracy,
      deviceid,
    } = req.query as any

    // Validate required fields
    if (!lat || !lon || !deviceid) {
      return res.status(400).json({
        error: 'Missing required fields: lat, lon, deviceid',
      })
    }

    // Parse values
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lon)
    const locationTimestamp = timestamp
      ? new Date(parseInt(timestamp) * 1000).toISOString()
      : new Date().toISOString()

    // Find driver by device ID
    // Device ID format: "crew_code:nickname" or just "driver_id"
    let driverId: string | null = null
    let crewId: string | null = null

    // Check if deviceid matches a driver_id directly
    const { data: driverByID } = await supabase
      .from('drivers')
      .select('id, crew_id')
      .eq('id', deviceid)
      .single()

    if (driverByID) {
      driverId = driverByID.id
      crewId = driverByID.crew_id
    } else {
      // Try parsing as "crew_code:nickname"
      if (deviceid.includes(':')) {
        const [crewCode, nickname] = deviceid.split(':')

        // Find crew by code
        const { data: crew } = await supabase
          .from('crews')
          .select('id')
          .eq('code', crewCode.toUpperCase())
          .single()

        if (crew) {
          // Find driver by nickname in crew
          const { data: driver } = await supabase
            .from('drivers')
            .select('id, crew_id')
            .eq('crew_id', crew.id)
            .eq('nickname', nickname)
            .single()

          if (driver) {
            driverId = driver.id
            crewId = driver.crew_id
          }
        }
      }
    }

    if (!driverId || !crewId) {
      return res.status(404).json({
        error: 'Driver not found',
        hint: 'Set Device ID to "crew_code:nickname" or "driver_id" in Traccar app',
      })
    }

    // Insert location
    const { error: insertError } = await supabase.from('locations').insert({
      driver_id: driverId,
      crew_id: crewId,
      latitude,
      longitude,
      accuracy: accuracy ? parseFloat(accuracy) : null,
      speed: speed ? parseFloat(speed) : null,
      heading: bearing ? parseFloat(bearing) : null,
      timestamp: locationTimestamp,
    })

    if (insertError) {
      console.error('Insert error:', insertError)
      return res.status(500).json({ error: 'Failed to save location' })
    }

    // Update driver's last_seen
    await supabase
      .from('drivers')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', driverId)

    // Success response (Traccar expects 200 OK)
    return res.status(200).send('OK')
  } catch (error) {
    console.error('Webhook error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
