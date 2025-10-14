import type { LocalDriverData } from '../types'

const STORAGE_KEY = 'crewmap_driver_data'

export const storage = {
  getDriverData(): LocalDriverData | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  },

  setDriverData(data: LocalDriverData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save driver data:', error)
    }
  },

  clearDriverData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear driver data:', error)
    }
  },
}
