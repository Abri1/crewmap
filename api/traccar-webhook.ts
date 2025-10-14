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
  // Log all incoming requests for debugging
  console.log('Webhook received:', {
    method: req.method,
    query: req.query,
    headers: req.headers,
  })

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
    // OsmAnd protocol supports both 'id' and 'deviceid' parameters
    const {
      lat,
      lon,
      timestamp,
      speed,
      bearing,
      heading,
      altitude,
      accuracy,
      deviceid,
      id,
      batt,
    } = req.query as any

    // Use either 'deviceid' or 'id' parameter
    const deviceIdentifier = deviceid || id

    console.log('Parsed location data:', { lat, lon, deviceIdentifier, allParams: req.query })

    // Validate required fields
    if (!lat || !lon || !deviceIdentifier) {
      console.error('Missing required fields:', { lat, lon, deviceid, id })
      return res.status(400).json({
        error: 'Missing required fields: lat, lon, and either deviceid or id',
        received: { lat, lon, deviceid, id },
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

    // Check if deviceIdentifier matches a driver_id directly
    const { data: driverByID } = await supabase
      .from('drivers')
      .select('id, crew_id')
      .eq('id', deviceIdentifier)
      .single()

    if (driverByID) {
      driverId = driverByID.id
      crewId = driverByID.crew_id
    } else {
      // Try parsing as "crew_code:nickname"
      if (deviceIdentifier.includes(':')) {
        const [crewCode, nickname] = deviceIdentifier.split(':')

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
      console.error('Driver not found:', { deviceIdentifier, driverId, crewId })
      return res.status(404).json({
        error: 'Driver not found',
        hint: 'Set Device ID (or "Identifier" field) to your driver UUID in Traccar app',
        deviceIdReceived: deviceIdentifier,
      })
    }

    console.log('Driver found:', { driverId, crewId, latitude, longitude })

    // Insert location
    // Use either 'bearing' or 'heading' parameter for direction
    const headingValue = bearing || heading

    const { error: insertError } = await supabase.from('locations').insert({
      driver_id: driverId,
      crew_id: crewId,
      latitude,
      longitude,
      accuracy: accuracy ? parseFloat(accuracy) : null,
      speed: speed ? parseFloat(speed) : null,
      heading: headingValue ? parseFloat(headingValue) : null,
      timestamp: locationTimestamp,
    })

    if (insertError) {
      console.error('Insert error:', insertError)
      return res.status(500).json({ error: 'Failed to save location', details: insertError })
    }

    console.log('Location saved successfully')

    // Update driver's last_seen
    await supabase
      .from('drivers')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', driverId)

    console.log('Driver last_seen updated')

    // Success response (Traccar expects 200 OK)
    return res.status(200).send('OK')
  } catch (error) {
    console.error('Webhook error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
