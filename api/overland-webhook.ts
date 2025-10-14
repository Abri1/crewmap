import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Overland sends location data as GeoJSON
interface OverlandLocation {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
  properties: {
    timestamp: string // ISO8601
    altitude?: number
    speed?: number
    horizontal_accuracy?: number
    vertical_accuracy?: number
    motion?: string[]
    battery_state?: string
    battery_level?: number
    device_id?: string
    wifi?: string
    [key: string]: any
  }
}

interface OverlandPayload {
  locations: OverlandLocation[]
  current?: OverlandLocation
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Log all incoming requests for debugging
  console.log('Overland webhook received:', {
    method: req.method,
    body: req.body,
    headers: req.headers,
  })

  // Only accept POST requests
  if (req.method !== 'POST') {
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

    const payload = req.body as OverlandPayload

    if (!payload.locations || !Array.isArray(payload.locations)) {
      console.error('Invalid payload format:', payload)
      return res.status(400).json({
        error: 'Invalid payload format',
        hint: 'Expected { locations: [...] }',
      })
    }

    console.log(`Processing ${payload.locations.length} location(s)`)

    // Process each location
    let successCount = 0
    let errorCount = 0

    for (const location of payload.locations) {
      try {
        const [longitude, latitude] = location.geometry.coordinates
        const props = location.properties
        const deviceId = props.device_id

        if (!deviceId) {
          console.error('Missing device_id in location:', location)
          errorCount++
          continue
        }

        // Find driver by device ID
        const { data: driver } = await supabase
          .from('drivers')
          .select('id, crew_id')
          .eq('id', deviceId)
          .single()

        if (!driver) {
          console.error('Driver not found:', { deviceId })
          errorCount++
          continue
        }

        // Insert location
        const { error: insertError } = await supabase.from('locations').insert({
          driver_id: driver.id,
          crew_id: driver.crew_id,
          latitude,
          longitude,
          accuracy: props.horizontal_accuracy || null,
          speed: props.speed || null,
          heading: null, // Overland doesn't provide heading
          timestamp: props.timestamp,
        })

        if (insertError) {
          console.error('Insert error:', insertError)
          errorCount++
          continue
        }

        // Update driver's last_seen
        await supabase
          .from('drivers')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', driver.id)

        successCount++
      } catch (error) {
        console.error('Error processing location:', error)
        errorCount++
      }
    }

    console.log(`Processed: ${successCount} success, ${errorCount} errors`)

    // Overland expects { result: "ok" } response
    return res.status(200).json({
      result: 'ok',
      saved: successCount,
      errors: errorCount,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
