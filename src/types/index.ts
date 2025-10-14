export interface Driver {
  id: string
  crew_id: string
  nickname: string
  truck_number?: string
  color: string
  created_at: string
  last_seen: string
  is_active: boolean
}

export interface Location {
  id: string
  driver_id: string
  crew_id: string
  latitude: number
  longitude: number
  accuracy?: number
  speed?: number
  heading?: number
  timestamp: string
  created_at: string
}

export interface Crew {
  id: string
  code: string
  name?: string
  created_at: string
  expires_at?: string
}

export interface LocalDriverData {
  driverId: string
  crewId: string
  crewCode: string
  crewName?: string
  nickname: string
  color: string
}
