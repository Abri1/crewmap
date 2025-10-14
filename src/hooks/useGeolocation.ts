import { useEffect, useState, useRef } from 'react'

export interface GeoPosition {
  latitude: number
  longitude: number
  accuracy: number | null
  speed: number | null
  heading: number | null
  timestamp: number
}

interface UseGeolocationOptions {
  enabled?: boolean
  minDistance?: number // meters
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const { enabled = true, minDistance = 10 } = options
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'watching' | 'error'>('idle')
  const lastPositionRef = useRef<GeoPosition | null>(null)

  useEffect(() => {
    if (!enabled) {
      setStatus('idle')
      return
    }

    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported')
      setStatus('error')
      return
    }

    setStatus('watching')
    setError(null)

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newPosition: GeoPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          speed: pos.coords.speed ?? null,
          heading: pos.coords.heading ?? null,
          timestamp: pos.timestamp,
        }

        // Check if we should update based on distance
        if (lastPositionRef.current && minDistance > 0) {
          const distance = calculateDistance(
            lastPositionRef.current.latitude,
            lastPositionRef.current.longitude,
            newPosition.latitude,
            newPosition.longitude
          )

          if (distance < minDistance) {
            return // Skip this update
          }
        }

        lastPositionRef.current = newPosition
        setPosition(newPosition)
      },
      (err) => {
        setError(err.message)
        setStatus('error')
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 15000,
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [enabled, minDistance])

  return { position, error, status }
}

// Haversine formula to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth radius in meters
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}
