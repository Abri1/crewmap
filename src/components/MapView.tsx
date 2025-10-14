import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Driver, Location } from '../types'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

// Driver status types
type DriverStatus = 'live' | 'active' | 'inactive' | 'offline'

// Get driver status based on last location timestamp
function getDriverStatus(lastLocationTimestamp: string | null): DriverStatus {
  if (!lastLocationTimestamp) return 'offline'

  const secondsSince = Math.floor((Date.now() - new Date(lastLocationTimestamp).getTime()) / 1000)

  if (secondsSince < 30) return 'live'
  if (secondsSince < 300) return 'active' // 5 minutes
  if (secondsSince < 3600) return 'inactive' // 1 hour
  return 'offline'
}

// Convert hex color to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface MapViewProps {
  currentPosition: { latitude: number; longitude: number } | null
  currentDriverId: string | null
  drivers: Driver[]
  locations: Record<string, Location[]> // driver_id -> locations
  onRecenterReady?: (recenterFn: () => void) => void
  onDriverClick?: (driverId: string) => void
}

export const MapView = ({ currentPosition, currentDriverId, drivers, locations, onRecenterReady, onDriverClick }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({})
  // Track last known positions to prevent unnecessary updates
  const lastPositionsRef = useRef<Record<string, { lat: number; lng: number }>>({})
  // Track if map is currently being moved
  const isMapMovingRef = useRef(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    if (!MAPBOX_TOKEN) {
      console.error('Missing Mapbox token')
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-98.5795, 39.8283], // Center of US (default)
      zoom: 4,
      pitch: 0, // Top-down view
      bearing: 0, // North-up
      dragRotate: false, // Disable rotation
      pitchWithRotate: false, // Disable tilt
      touchPitch: false, // Disable pitch on touch
      touchZoomRotate: {
        rotate: false, // Disable rotation with pinch
      },
    })

    // Disable pitch and rotation completely
    map.current.on('load', () => {
      setMapLoaded(true)

      // Force lock pitch and bearing
      map.current?.on('move', () => {
        const currentPitch = map.current?.getPitch()
        const currentBearing = map.current?.getBearing()

        if (currentPitch !== 0) {
          map.current?.setPitch(0)
        }
        if (currentBearing !== 0) {
          map.current?.setBearing(0)
        }
      })

      // Track when map is being moved by user
      map.current?.on('movestart', () => {
        isMapMovingRef.current = true
      })

      map.current?.on('moveend', () => {
        isMapMovingRef.current = false
      })
    })

    // No default controls - we'll add custom recenter button in App

    return () => {
      Object.values(markersRef.current).forEach(marker => marker.remove())
      markersRef.current = {}
      lastPositionsRef.current = {}
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Provide recenter function to parent
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    const recenter = () => {
      if (currentPosition && map.current) {
        map.current.flyTo({
          center: [currentPosition.longitude, currentPosition.latitude],
          zoom: 17, // Higher zoom for more accuracy
          pitch: 0,
          bearing: 0,
          duration: 800,
        })
      }
    }

    onRecenterReady?.(recenter)
  }, [mapLoaded, currentPosition, onRecenterReady])

  // Center on user's location when available (initial only)
  const hasCenteredRef = useRef(false)
  useEffect(() => {
    if (!map.current || !currentPosition || hasCenteredRef.current) return

    map.current.flyTo({
      center: [currentPosition.longitude, currentPosition.latitude],
      zoom: 16, // Higher initial zoom for better accuracy
      pitch: 0,
      bearing: 0,
      duration: 1500,
    })
    hasCenteredRef.current = true
  }, [currentPosition])

  // Create/remove driver markers (only when drivers or locations change significantly)
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Remove markers for drivers that no longer exist
    Object.keys(markersRef.current).forEach(driverId => {
      if (!drivers.find(d => d.id === driverId)) {
        markersRef.current[driverId].remove()
        delete markersRef.current[driverId]
        delete lastPositionsRef.current[driverId]
      }
    })

    // Add markers for new drivers
    drivers.forEach(driver => {
      if (markersRef.current[driver.id]) return // Marker already exists

      const isCurrentUser = driver.id === currentDriverId
      const driverLocations = locations[driver.id] || []
      const latestLocation = driverLocations[driverLocations.length - 1]

      // For current user, use currentPosition if no location data yet
      let position = latestLocation
      if (isCurrentUser && !position && currentPosition) {
        position = {
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
        } as Location
      }

      if (!position) return

      // Get initial status
      const status = latestLocation ? getDriverStatus(latestLocation.timestamp) : 'offline'

      // Create new marker
      const el = document.createElement('div')
      el.className = `driver-marker marker-${status}`
      el.style.backgroundColor = driver.color

      // Base size and border - smaller for more precision
      const baseSize = isCurrentUser ? 16 : 14
      const borderWidth = isCurrentUser ? 3 : 2
      el.style.width = `${baseSize}px`
      el.style.height = `${baseSize}px`
      el.style.borderRadius = '50%'
      el.style.border = `${borderWidth}px solid white`
      el.style.cursor = 'pointer'
      el.style.transition = 'all 0.3s ease'
      el.style.position = 'absolute'
      // Center the marker precisely using transform
      el.style.transform = 'translate(-50%, -50%)'

      // Add a center dot for precise position indication
      const centerDot = document.createElement('div')
      centerDot.style.position = 'absolute'
      centerDot.style.top = '50%'
      centerDot.style.left = '50%'
      centerDot.style.width = '3px'
      centerDot.style.height = '3px'
      centerDot.style.borderRadius = '50%'
      centerDot.style.backgroundColor = 'white'
      centerDot.style.transform = 'translate(-50%, -50%)'
      centerDot.style.boxShadow = '0 0 2px rgba(0,0,0,0.8)'
      centerDot.style.pointerEvents = 'none'
      el.appendChild(centerDot)

      // Apply initial status styling
      if (status === 'live') {
        el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.4), 0 0 0 0 rgba(34,197,94,0.7)'
        el.style.animation = 'pulse 2s ease-in-out infinite'
        el.style.opacity = '1'
        el.style.filter = 'none'
      } else if (status === 'active') {
        el.style.boxShadow = isCurrentUser
          ? '0 3px 12px rgba(0,0,0,0.5), 0 0 0 4px rgba(255,255,255,0.3)'
          : '0 2px 8px rgba(0,0,0,0.4)'
        el.style.opacity = '1'
        el.style.filter = 'none'
      } else if (status === 'inactive') {
        el.style.opacity = '0.6'
        el.style.filter = 'grayscale(0.3)'
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)'
        el.style.animation = 'none'
      } else { // offline
        el.style.opacity = '0.4'
        el.style.filter = 'grayscale(0.7)'
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
        el.style.animation = 'none'
      }

      el.title = isCurrentUser ? `${driver.nickname} (You)` : driver.nickname

      // Add click handler
      el.addEventListener('click', () => {
        onDriverClick?.(driver.id)
      })

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([position.longitude, position.latitude])
        .addTo(map.current!)

      markersRef.current[driver.id] = marker
      // Store initial position
      lastPositionsRef.current[driver.id] = {
        lat: position.latitude,
        lng: position.longitude,
      }
    })
  }, [drivers, mapLoaded, currentDriverId, onDriverClick])

  // Update marker positions and styling (separate effect)
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Skip marker updates if map is being moved by user to prevent jitter
    if (isMapMovingRef.current) return

    drivers.forEach(driver => {
      const marker = markersRef.current[driver.id]
      if (!marker) return

      const isCurrentUser = driver.id === currentDriverId
      const driverLocations = locations[driver.id] || []
      const latestLocation = driverLocations[driverLocations.length - 1]

      // Get position
      let position = latestLocation
      if (isCurrentUser && !position && currentPosition) {
        position = {
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
        } as Location
      }

      if (!position) return

      // Update position only if it changed (compare against stored position)
      const lastPos = lastPositionsRef.current[driver.id]
      const hasPositionChanged =
        !lastPos ||
        Math.abs(lastPos.lng - position.longitude) > 0.00001 ||
        Math.abs(lastPos.lat - position.latitude) > 0.00001

      if (hasPositionChanged) {
        marker.setLngLat([position.longitude, position.latitude])
        // Update stored position
        lastPositionsRef.current[driver.id] = {
          lat: position.latitude,
          lng: position.longitude,
        }
      }

      // Update status styling
      const status = latestLocation ? getDriverStatus(latestLocation.timestamp) : 'offline'
      const el = marker.getElement()

      // Update class
      el.className = `driver-marker marker-${status}`

      // Update status-specific styling
      if (status === 'live') {
        el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.4), 0 0 0 0 rgba(34,197,94,0.7)'
        el.style.animation = 'pulse 2s ease-in-out infinite'
        el.style.opacity = '1'
        el.style.filter = 'none'
      } else if (status === 'active') {
        el.style.boxShadow = isCurrentUser
          ? '0 3px 12px rgba(0,0,0,0.5), 0 0 0 4px rgba(255,255,255,0.3)'
          : '0 2px 8px rgba(0,0,0,0.4)'
        el.style.opacity = '1'
        el.style.filter = 'none'
        el.style.animation = 'none'
      } else if (status === 'inactive') {
        el.style.opacity = '0.6'
        el.style.filter = 'grayscale(0.3)'
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)'
        el.style.animation = 'none'
      } else { // offline
        el.style.opacity = '0.4'
        el.style.filter = 'grayscale(0.7)'
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
        el.style.animation = 'none'
      }
    })
  }, [locations, currentPosition, drivers, currentDriverId, mapLoaded])

  // Draw trails - create layers only once
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    drivers.forEach(driver => {
      const layerId = `trail-${driver.id}`
      const sourceId = `trail-source-${driver.id}`

      // Only create if doesn't exist
      if (!map.current!.getSource(sourceId)) {
        map.current!.addSource(sourceId, {
          type: 'geojson',
          lineMetrics: true,
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [],
            },
          },
        })

        // Convert hex to rgba for gradient
        const color = driver.color

        map.current!.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': color,
            'line-width': [
              'interpolate',
              ['exponential', 1.5],
              ['zoom'],
              10, 2,  // At zoom 10, line is 2px
              15, 3,  // At zoom 15, line is 3px
              20, 4,  // At zoom 20, line is 4px
            ],
            'line-gradient': [
              'interpolate',
              ['linear'],
              ['line-progress'],
              0, hexToRgba(color, 0.2), // 20% opacity at start
              0.5, hexToRgba(color, 0.6), // 60% opacity at middle
              1, hexToRgba(color, 0.9), // 90% opacity at end
            ],
          },
        })
      }
    })

    // Remove layers/sources for drivers that left
    const driverIds = new Set(drivers.map(d => d.id))

    // Find all existing trail sources
    const style = map.current!.getStyle()
    if (style && style.sources) {
      Object.keys(style.sources).forEach(sourceId => {
        if (sourceId.startsWith('trail-source-')) {
          const driverId = sourceId.replace('trail-source-', '')
          if (!driverIds.has(driverId)) {
            const layerId = `trail-${driverId}`
            if (map.current!.getLayer(layerId)) {
              map.current!.removeLayer(layerId)
            }
            if (map.current!.getSource(sourceId)) {
              map.current!.removeSource(sourceId)
            }
          }
        }
      })
    }
  }, [drivers, mapLoaded])

  // Update trail data (separate effect)
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    drivers.forEach(driver => {
      const sourceId = `trail-source-${driver.id}`
      const source = map.current!.getSource(sourceId)

      if (!source) return

      const driverLocations = locations[driver.id] || []

      if (driverLocations.length < 2) {
        // Clear trail if not enough points
        ;(source as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        })
        return
      }

      // Update trail data
      const coordinates = driverLocations.map((loc, idx) => [
        loc.longitude,
        loc.latitude,
        idx / (driverLocations.length - 1), // 0 to 1 progress
      ])

      ;(source as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates,
        },
      })
    })
  }, [drivers, locations, mapLoaded])

  return (
    <div
      ref={mapContainer}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
      }}
    />
  )
}
