import { useEffect, useState, useCallback, useRef } from 'react'
import { OnboardingScreen } from './components/OnboardingScreen'
import { TraccarSetup } from './components/TraccarSetup'
import { MapView } from './components/MapView'
import { supabase } from './lib/supabase'
import { storage } from './lib/storage'
import type { Driver, Location, LocalDriverData } from './types'
import './App.css'

// Color palette for drivers
const DRIVER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
]

function generateCrewCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'CONVOY-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function getRandomColor(existingColors: string[]): string {
  const availableColors = DRIVER_COLORS.filter(c => !existingColors.includes(c))
  if (availableColors.length === 0) {
    return DRIVER_COLORS[Math.floor(Math.random() * DRIVER_COLORS.length)]
  }
  return availableColors[Math.floor(Math.random() * availableColors.length)]
}

// Calculate distance between two points (Haversine formula)
function calculateDistanceBetweenPoints(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const radLat1 = (lat1 * Math.PI) / 180
  const radLat2 = (lat2 * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Calculate distance from trail
function calculateDistance(locs: Location[]): number {
  if (locs.length < 2) return 0

  let total = 0
  for (let i = 1; i < locs.length; i++) {
    total += calculateDistanceBetweenPoints(
      locs[i - 1].latitude,
      locs[i - 1].longitude,
      locs[i].latitude,
      locs[i].longitude
    )
  }
  return total
}

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

// Format time since last update
function formatTimeSince(timestamp: string): string {
  const secondsSince = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)

  if (secondsSince < 30) return 'Live'
  if (secondsSince < 60) return `${secondsSince}s ago`

  const minutesSince = Math.floor(secondsSince / 60)
  if (minutesSince < 60) return `${minutesSince}m ago`

  const hoursSince = Math.floor(minutesSince / 60)
  if (hoursSince < 24) return `${hoursSince}h ago`

  const daysSince = Math.floor(hoursSince / 24)
  if (daysSince === 1) return 'Yesterday'
  return `${daysSince}d ago`
}

function App() {
  const [localDriver, setLocalDriver] = useState<LocalDriverData | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [locations, setLocations] = useState<Record<string, Location[]>>({})
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)
  const [showTraccarSetup, setShowTraccarSetup] = useState(false)

  // Browser geolocation disabled - using Traccar native apps only
  const position: { latitude: number; longitude: number; speed: number | null; accuracy: number | null } | null = null

  const recenterFnRef = useRef<(() => void) | null>(null)

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Load saved driver data on mount
  useEffect(() => {
    const saved = storage.getDriverData()
    if (saved) {
      setLocalDriver(saved)
    }
    setLoading(false)
  }, [])

  // Subscribe to crew drivers
  useEffect(() => {
    if (!localDriver) return

    const fetchDrivers = async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('crew_id', localDriver.crewId)
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching drivers:', error)
        return
      }

      setDrivers(data || [])
    }

    fetchDrivers()

    // Subscribe to driver changes
    const channel = supabase
      .channel(`crew:${localDriver.crewId}:drivers`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers',
          filter: `crew_id=eq.${localDriver.crewId}`,
        },
        () => {
          fetchDrivers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [localDriver])

  // Subscribe to locations
  useEffect(() => {
    if (!localDriver) return

    const fetchLocations = async () => {
      // Get ALL locations per driver from the last 24 hours (no limit)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('crew_id', localDriver.crewId)
        .gte('timestamp', twentyFourHoursAgo)
        .order('timestamp', { ascending: true })

      if (error) {
        console.error('Error fetching locations:', error)
        return
      }

      // Group by driver
      const grouped: Record<string, Location[]> = {}
      data?.forEach(loc => {
        if (!grouped[loc.driver_id]) {
          grouped[loc.driver_id] = []
        }
        grouped[loc.driver_id].push(loc)
      })

      setLocations(grouped)
    }

    fetchLocations()

    // Subscribe to new locations
    const channel = supabase
      .channel(`crew:${localDriver.crewId}:locations`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'locations',
          filter: `crew_id=eq.${localDriver.crewId}`,
        },
        (payload) => {
          const newLocation = payload.new as Location
          setLocations(prev => ({
            ...prev,
            [newLocation.driver_id]: [
              ...(prev[newLocation.driver_id] || []),
              newLocation,
            ], // Keep all points from last 24 hours
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [localDriver])

  // Browser location sync disabled - using Traccar webhook instead
  // Location data comes from /api/traccar-webhook endpoint

  const handleJoinCrew = useCallback(async (code: string, nickname: string) => {
    // Check if crew exists
    const { data: crew, error: crewError } = await supabase
      .from('crews')
      .select('id, name')
      .eq('code', code)
      .single()

    if (crewError || !crew) {
      throw new Error('Crew not found. Please check the code and try again.')
    }

    // Get existing driver colors
    const { data: existingDrivers } = await supabase
      .from('drivers')
      .select('color')
      .eq('crew_id', crew.id)

    const existingColors = existingDrivers?.map(d => d.color) || []
    const color = getRandomColor(existingColors)

    // Create driver
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .insert({
        crew_id: crew.id,
        nickname,
        color,
        is_active: true,
        last_seen: new Date().toISOString(),
      })
      .select()
      .single()

    if (driverError || !driver) {
      throw new Error('Failed to join crew')
    }

    const driverData: LocalDriverData = {
      driverId: driver.id,
      crewId: crew.id,
      crewCode: code,
      crewName: crew.name || undefined,
      nickname,
      color,
    }

    storage.setDriverData(driverData)
    setLocalDriver(driverData)
    setShowTraccarSetup(true)
  }, [])

  const handleCreateCrew = useCallback(async (crewName: string, nickname: string) => {
    const code = generateCrewCode()

    // Create crew
    const { data: crew, error: crewError } = await supabase
      .from('crews')
      .insert({ code, name: crewName })
      .select()
      .single()

    if (crewError || !crew) {
      throw new Error('Failed to create crew')
    }

    const color = DRIVER_COLORS[0]

    // Create driver
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .insert({
        crew_id: crew.id,
        nickname,
        color,
        is_active: true,
        last_seen: new Date().toISOString(),
      })
      .select()
      .single()

    if (driverError || !driver) {
      throw new Error('Failed to create driver')
    }

    const driverData: LocalDriverData = {
      driverId: driver.id,
      crewId: crew.id,
      crewCode: code,
      crewName,
      nickname,
      color,
    }

    storage.setDriverData(driverData)
    setLocalDriver(driverData)
    setShowTraccarSetup(true)
  }, [])

  const handleRecenterReady = useCallback((fn: () => void) => {
    recenterFnRef.current = fn
  }, [])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!localDriver) {
    return (
      <OnboardingScreen
        onJoinCrew={handleJoinCrew}
        onCreateCrew={handleCreateCrew}
      />
    )
  }

  // Show Traccar setup screen after joining/creating crew
  if (showTraccarSetup) {
    return (
      <TraccarSetup
        driverId={localDriver.driverId}
        nickname={localDriver.nickname}
        onComplete={() => setShowTraccarSetup(false)}
      />
    )
  }

  // Calculate stats
  const myLocations = locations[localDriver.driverId] || []
  const myDistance = calculateDistance(myLocations)
  const mySpeed = 0 // Speed only available from Traccar, not in browser view
  const firstLocation = myLocations[0]
  const timeOnRoad = firstLocation
    ? Math.floor((Date.now() - new Date(firstLocation.timestamp).getTime()) / 1000 / 60)
    : 0

  // Connection quality (always unknown since no browser GPS)
  const connectionQuality = 'unknown'

  const handleDriverClick = (driverId: string) => {
    setSelectedDriverId(driverId)
  }

  const selectedDriver = selectedDriverId ? drivers.find(d => d.id === selectedDriverId) : null
  const selectedDriverLocations = selectedDriverId ? locations[selectedDriverId] || [] : []
  const selectedDriverDistance = calculateDistance(selectedDriverLocations)
  const selectedDriverSpeed = 0 // Speed only available from Traccar, not in browser view
  const selectedDriverTimeOnRoad = selectedDriverLocations[0]
    ? Math.floor((Date.now() - new Date(selectedDriverLocations[0].timestamp).getTime()) / 1000 / 60)
    : 0
  const selectedDriverLastUpdate = selectedDriverLocations[selectedDriverLocations.length - 1]
  const selectedDriverStatus = selectedDriverLastUpdate ? getDriverStatus(selectedDriverLastUpdate.timestamp) : 'offline'

  return (
    <div className="app-container">
      <MapView
        currentPosition={null} // Position only from Traccar, not browser
        currentDriverId={localDriver.driverId}
        drivers={drivers}
        locations={locations}
        onRecenterReady={handleRecenterReady}
        onDriverClick={handleDriverClick}
      />

      {/* Top HUD */}
      <div className="hud-top">
        <div className="hud-left">
          <button
            className="menu-button"
            onClick={() => setMenuOpen(true)}
            type="button"
            title="Menu"
          >
            <span className="hamburger-icon">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          <div>
            <div className="crew-title">{localDriver.crewName || 'Crew'}</div>
            <div className="crew-subtitle">
              {drivers.length} online
            </div>
          </div>
        </div>
        <div className="hud-right">
          <div className="clock">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          <div className={`connection-indicator ${connectionQuality}`}></div>
        </div>
      </div>

      {/* Recenter Button */}
      <button
        className="recenter-button"
        onClick={() => recenterFnRef.current?.()}
        disabled={!position}
        type="button"
        title="Recenter on your location"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M12 2v4M12 18v4M22 12h-4M6 12H2" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      {/* Menu Panel */}
      {menuOpen && (
        <>
          <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>
          <div className="menu-panel">
            <div className="menu-header">
              <h2>Menu</h2>
              <button className="close-button" onClick={() => setMenuOpen(false)} type="button">
                <span className="close-icon">
                  <span></span>
                  <span></span>
                </span>
              </button>
            </div>

            <div className="menu-section">
              <h3>Your Info</h3>
              <div className="profile-card">
                <div className="driver-dot" style={{ backgroundColor: localDriver.color }}></div>
                <div>
                  <div className="profile-name">{localDriver.nickname}</div>
                  <div className="profile-subtitle">Code: {localDriver.crewCode}</div>
                  <div className="profile-subtitle" style={{ marginTop: '4px', fontSize: '11px', opacity: 0.7 }}>
                    Using Traccar GPS
                  </div>
                </div>
              </div>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Speed</div>
                  <div className="stat-value">{mySpeed} km/h</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Distance</div>
                  <div className="stat-value">{(myDistance / 1000).toFixed(1)} km</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Time</div>
                  <div className="stat-value">{timeOnRoad > 0 ? `${timeOnRoad}m` : '--'}</div>
                </div>
              </div>
            </div>

            <div className="menu-section">
              <h3>Crew Members ({drivers.length})</h3>
              <div className="driver-list">
                {drivers.map(driver => {
                  const isMe = driver.id === localDriver.driverId
                  const driverLocs = locations[driver.id] || []
                  const lastUpdate = driverLocs[driverLocs.length - 1]
                  const status = lastUpdate ? getDriverStatus(lastUpdate.timestamp) : 'offline'

                  return (
                    <div
                      key={driver.id}
                      className={`driver-list-item ${isMe ? 'me' : ''}`}
                      onClick={() => {
                        handleDriverClick(driver.id)
                        setMenuOpen(false)
                      }}
                    >
                      <div
                        className={`driver-dot driver-dot-${status}`}
                        style={{ backgroundColor: driver.color }}
                      ></div>
                      <div className="driver-details">
                        <div className="driver-name-row">
                          {driver.nickname} {isMe && '(You)'}
                        </div>
                        <div className="driver-status-row">
                          {lastUpdate ? formatTimeSince(lastUpdate.timestamp) : 'Waiting...'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="menu-section">
              <button
                className="leave-button-full"
                onClick={() => {
                  if (confirm('Leave this crew?')) {
                    storage.clearDriverData()
                    window.location.reload()
                  }
                }}
                type="button"
              >
                Leave Crew
              </button>
            </div>
          </div>
        </>
      )}

      {/* Driver Info Bottom Sheet */}
      {selectedDriver && (
        <>
          <div className="bottom-sheet-overlay" onClick={() => setSelectedDriverId(null)}></div>
          <div className="bottom-sheet">
            <div className="bottom-sheet-handle"></div>
            <div className="bottom-sheet-content">
              <div className="driver-info-header">
                <div
                  className={`driver-dot-large driver-dot-${selectedDriverStatus}`}
                  style={{ backgroundColor: selectedDriver.color }}
                ></div>
                <div>
                  <h3>{selectedDriver.nickname}</h3>
                  <p className="driver-info-status">
                    {selectedDriverLastUpdate
                      ? formatTimeSince(selectedDriverLastUpdate.timestamp)
                      : 'Waiting for location...'}
                  </p>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Speed</div>
                  <div className="stat-value">{selectedDriverSpeed} km/h</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Distance</div>
                  <div className="stat-value">{(selectedDriverDistance / 1000).toFixed(1)} km</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Time</div>
                  <div className="stat-value">{selectedDriverTimeOnRoad > 0 ? `${selectedDriverTimeOnRoad}m` : '--'}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default App
