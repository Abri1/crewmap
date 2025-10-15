// Traccar Server Integration
// Using Traccar demo server with your account
const TRACCAR_SERVER = 'https://server.traccar.org'
const TRACCAR_API = `${TRACCAR_SERVER}/api`
const TRACCAR_EMAIL = import.meta.env.VITE_TRACCAR_EMAIL || 'abribooysen@gmail.com'
const TRACCAR_PASSWORD = import.meta.env.VITE_TRACCAR_PASSWORD || 'fyjndjcu'

export interface TraccarDevice {
  id: number
  name: string
  uniqueId: string
  status: string
  lastUpdate: string | null
  positionId: number
  phone: string
  model: string
  contact: string
  category: string
}

export interface TraccarPosition {
  id: number
  deviceId: number
  protocol: string
  deviceTime: string
  fixTime: string
  serverTime: string
  outdated: boolean
  valid: boolean
  latitude: number
  longitude: number
  altitude: number
  speed: number
  course: number
  address: string | null
  accuracy: number
  network: any
  attributes: {
    batteryLevel?: number
    distance?: number
    totalDistance?: number
    motion?: boolean
    [key: string]: any
  }
}

export interface TraccarSession {
  id: number
  name: string
  email: string
  administrator: boolean
  readonly: boolean
  deviceReadonly: boolean
  limitCommands: boolean
  disabled: boolean
  expirationTime: string | null
  deviceLimit: number
  userLimit: number
  token: string | null
}

class TraccarAPI {
  /**
   * Create a new session (login)
   */
  async createSession(email: string, password: string): Promise<TraccarSession> {
    const response = await fetch(`${TRACCAR_API}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ email, password }),
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to create Traccar session')
    }

    return response.json()
  }

  /**
   * Register a new device on Traccar server
   */
  async registerDevice(deviceData: {
    name: string
    uniqueId: string
    phone?: string
    model?: string
    category?: string
  }): Promise<TraccarDevice> {
    const response = await fetch(`${TRACCAR_API}/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader(),
      },
      body: JSON.stringify({
        name: deviceData.name,
        uniqueId: deviceData.uniqueId,
        phone: deviceData.phone || '',
        model: deviceData.model || 'Traccar Client',
        category: deviceData.category || 'default',
      }),
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to register device: ${error}`)
    }

    return response.json()
  }

  /**
   * Get all devices for the authenticated user
   */
  async getDevices(): Promise<TraccarDevice[]> {
    const response = await fetch(`${TRACCAR_API}/devices`, {
      headers: {
        'Authorization': this.getAuthHeader(),
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch devices')
    }

    return response.json()
  }

  /**
   * Get device by unique ID
   */
  async getDeviceByUniqueId(uniqueId: string): Promise<TraccarDevice | null> {
    const devices = await this.getDevices()
    return devices.find(d => d.uniqueId === uniqueId) || null
  }

  /**
   * Get latest positions for all devices
   */
  async getPositions(deviceIds?: number[]): Promise<TraccarPosition[]> {
    let url = `${TRACCAR_API}/positions`

    if (deviceIds && deviceIds.length > 0) {
      const params = new URLSearchParams()
      deviceIds.forEach(id => params.append('deviceId', id.toString()))
      url += `?${params.toString()}`
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': this.getAuthHeader(),
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch positions')
    }

    return response.json()
  }

  /**
   * Get position for a specific device
   */
  async getDevicePosition(deviceId: number): Promise<TraccarPosition | null> {
    const positions = await this.getPositions([deviceId])
    return positions[0] || null
  }

  /**
   * Connect to WebSocket for real-time updates
   */
  connectWebSocket(onMessage: (data: any) => void): WebSocket {
    const ws = new WebSocket(`${TRACCAR_SERVER}/api/socket`)

    ws.onopen = () => {
      console.log('Traccar WebSocket connected')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      onMessage(data)
    }

    ws.onerror = (error) => {
      console.error('Traccar WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('Traccar WebSocket closed')
    }

    return ws
  }

  /**
   * Helper to get Authorization header
   */
  private getAuthHeader(): string {
    const credentials = btoa(`${TRACCAR_EMAIL}:${TRACCAR_PASSWORD}`)
    return `Basic ${credentials}`
  }

  /**
   * Get Traccar server URL for device configuration
   */
  getServerUrl(): string {
    return TRACCAR_SERVER
  }

  /**
   * Get device port for Traccar Client app
   */
  getDevicePort(): number {
    return 5055 // OsmAnd protocol default port
  }

  /**
   * Get positions for specific device unique IDs (no auth required on demo server)
   */
  async getPositionsByUniqueIds(uniqueIds: string[]): Promise<Record<string, TraccarPosition>> {
    try {
      // Get all devices with authentication
      const devicesResponse = await fetch(`${TRACCAR_API}/devices`, {
        headers: {
          'Authorization': this.getAuthHeader(),
        },
        credentials: 'include',
      })

      if (!devicesResponse.ok) {
        console.error('Failed to fetch devices:', devicesResponse.status)
        return {}
      }

      const allDevices: TraccarDevice[] = await devicesResponse.json()

      // Filter to only devices matching our unique IDs
      const ourDevices = allDevices.filter(d => uniqueIds.includes(d.uniqueId))

      if (ourDevices.length === 0) {
        return {}
      }

      // Get all positions with authentication
      const positionsResponse = await fetch(`${TRACCAR_API}/positions`, {
        headers: {
          'Authorization': this.getAuthHeader(),
        },
        credentials: 'include',
      })

      if (!positionsResponse.ok) {
        console.error('Failed to fetch positions:', positionsResponse.status)
        return {}
      }

      const allPositions: TraccarPosition[] = await positionsResponse.json()

      // Map positions by uniqueId (driver ID)
      const positionsByUniqueId: Record<string, TraccarPosition> = {}

      for (const device of ourDevices) {
        const position = allPositions.find(p => p.deviceId === device.id)
        if (position) {
          positionsByUniqueId[device.uniqueId] = position
        }
      }

      return positionsByUniqueId
    } catch (error) {
      console.error('Traccar fetch error:', error)
      return {}
    }
  }
}

export const traccarAPI = new TraccarAPI()
