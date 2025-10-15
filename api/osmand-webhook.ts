// OsmAnd Protocol Webhook for Traccar Client
// Traccar Client uses OsmAnd protocol: ?lat={0}&lon={1}&timestamp={2}&hdop={3}&altitude={4}&speed={5}&id={6}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept GET requests (OsmAnd protocol uses GET)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      lat,
      lon,
      id,
      deviceid, // Some versions use deviceid instead of id
      timestamp,
      speed,
      altitude,
      hdop, // Horizontal dilution of precision (accuracy)
      bearing,
    } = req.query

    // Device ID is the driver UUID
    const driverId = (id || deviceid) as string

    if (!driverId || !lat || !lon) {
      return res.status(400).json({ error: 'Missing required parameters: id, lat, lon' })
    }

    const latitude = parseFloat(lat as string)
    const longitude = parseFloat(lon as string)

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' })
    }

    // Get driver info to find crew_id
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, crew_id')
      .eq('id', driverId)
      .single()

    if (driverError || !driver) {
      console.error('Driver not found:', driverId, driverError)
      return res.status(404).json({ error: 'Driver not found' })
    }

    // Parse optional fields
    const speedKmh = speed ? parseFloat(speed as string) : null
    const altitudeMeters = altitude ? parseFloat(altitude as string) : null
    const accuracy = hdop ? parseFloat(hdop as string) : null
    const headingDegrees = bearing ? parseFloat(bearing as string) : null

    // Use provided timestamp or current time
    const locationTimestamp = timestamp
      ? new Date(parseInt(timestamp as string) * 1000).toISOString()
      : new Date().toISOString()

    // Insert location
    const { error: insertError } = await supabase
      .from('locations')
      .insert({
        driver_id: driverId,
        crew_id: driver.crew_id,
        latitude,
        longitude,
        accuracy,
        speed: speedKmh,
        heading: headingDegrees,
        timestamp: locationTimestamp,
      })

    if (insertError) {
      console.error('Error inserting location:', insertError)
      return res.status(500).json({ error: 'Failed to save location' })
    }

    // Update driver's last_seen
    await supabase
      .from('drivers')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', driverId)

    // Return success (OsmAnd protocol expects HTTP 200)
    return res.status(200).send('OK')
  } catch (error) {
    console.error('Webhook error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
