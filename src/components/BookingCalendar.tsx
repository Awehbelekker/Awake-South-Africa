'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useBookingsStore, TimeSlot } from '@/store/bookings'

interface BookingCalendarProps {
  locationId: string
  onSelectSlot: (date: string, timeSlot: TimeSlot) => void
  selectedDate?: string
  selectedTime?: string
}

export default function BookingCalendar({ locationId, onSelectSlot, selectedDate, selectedTime }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { getAvailableSlots, isDateBlocked, timeSlots } = useBookingsStore()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    const days: (Date | null)[] = []
    for (let i = 0; i < startPadding; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    return days
  }, [currentMonth])

  const formatDateString = (date: Date): string => date.toISOString().split('T')[0]

  const isDateAvailable = (date: Date): boolean => {
    if (date < today) return false
    const dateStr = formatDateString(date)
    if (isDateBlocked(dateStr, locationId)) return false
    return getAvailableSlots(dateStr, locationId).length > 0
  }

  const availableSlots = selectedDate ? getAvailableSlots(selectedDate, locationId) : []
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))

  return (
    <div className="bg-awake-gray rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          disabled={currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear()}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
        <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs text-gray-400 py-2">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-6">
        {calendarDays.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} className="aspect-square" />
          const dateStr = formatDateString(date)
          const isAvailable = isDateAvailable(date)
          const isSelected = selectedDate === dateStr
          const isPast = date < today
          return (
            <button key={dateStr} onClick={() => isAvailable && onSelectSlot(dateStr, timeSlots[0])} disabled={!isAvailable}
              className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                isSelected ? 'bg-accent-primary text-awake-black' : isAvailable ? 'bg-white/10 hover:bg-accent-primary/50 text-white' : isPast ? 'text-gray-600 cursor-not-allowed' : 'text-gray-500 cursor-not-allowed'
              }`}>
              {date.getDate()}
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">Available Times</h4>
          {availableSlots.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {availableSlots.map((slot) => (
                <button key={slot.id} onClick={() => onSelectSlot(selectedDate, slot)}
                  className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                    selectedTime === slot.time ? 'bg-accent-primary text-awake-black' : 'bg-white/10 hover:bg-accent-primary/50 text-white'
                  }`}>
                  {slot.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No available slots for this date</p>
          )}
        </div>
      )}
    </div>
  )
}

