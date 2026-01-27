// Demo locations store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SA_CONTENT } from '@/lib/constants'

export interface DemoLocation {
  id: string
  name: string
  area: string
  image: string
  description?: string
  price?: number
  active?: boolean
}

interface DemoLocationsStore {
  locations: DemoLocation[]
  updateLocation: (id: string, updates: Partial<DemoLocation>) => void
  addLocation: (location: DemoLocation) => void
  deleteLocation: (id: string) => void
  resetLocations: () => void
  getLocationById: (id: string) => DemoLocation | undefined
}

// Convert default locations to full format with IDs
const getDefaultLocations = (): DemoLocation[] => {
  return SA_CONTENT.demo.locations.map((loc, index) => ({
    id: `location-${index + 1}`,
    name: loc.name,
    area: loc.area,
    image: loc.image,
    description: `Experience the thrill of electric watersports at ${loc.name}`,
    price: 1500, // Default price R1,500
    active: true,
  }))
}

export const useDemoLocationsStore = create<DemoLocationsStore>()(
  persist(
    (set, get) => ({
      locations: getDefaultLocations(),
      updateLocation: (id, updates) =>
        set((state) => ({
          locations: state.locations.map((loc) =>
            loc.id === id ? { ...loc, ...updates } : loc
          ),
        })),
      addLocation: (location) =>
        set((state) => ({
          locations: [...state.locations, location],
        })),
      deleteLocation: (id) =>
        set((state) => ({
          locations: state.locations.filter((loc) => loc.id !== id),
        })),
      resetLocations: () => set({ locations: getDefaultLocations() }),
      getLocationById: (id) => get().locations.find((loc) => loc.id === id),
    }),
    {
      name: 'demo-locations-storage',
    }
  )
)
