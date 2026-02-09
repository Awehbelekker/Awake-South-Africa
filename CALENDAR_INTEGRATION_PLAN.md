# Calendar Integration Plan

## Overview
Integrate Google Calendar and Microsoft Calendar with the existing demo booking system for two-way synchronization.

---

## Current Booking System

**Existing Features:**
- ✅ Demo locations management (`/admin/locations`)
- ✅ Booking creation and management (`/admin/bookings`)
- ✅ Booking status workflow (pending → confirmed/rejected)
- ✅ localStorage-based storage

**What We're Adding:**
- 🔄 Two-way sync with Google Calendar
- 🔄 Two-way sync with Microsoft Calendar
- 🔄 Conflict detection (prevent double-bookings)
- 🔄 Automatic calendar event creation
- 🔄 Calendar event updates when booking status changes

---

## Architecture

### Database Schema

```sql
-- Add calendar integration fields to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS google_calendar_enabled BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS google_calendar_calendar_id VARCHAR(255);

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS microsoft_calendar_enabled BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS microsoft_calendar_refresh_token TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS microsoft_calendar_calendar_id VARCHAR(255);

-- Create booking_calendar_sync table
CREATE TABLE IF NOT EXISTS booking_calendar_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id VARCHAR(255) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  google_event_id VARCHAR(255),
  microsoft_event_id VARCHAR(255),
  last_synced_at TIMESTAMP DEFAULT NOW(),
  sync_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'synced', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_booking_calendar_sync_booking_id ON booking_calendar_sync(booking_id);
CREATE INDEX idx_booking_calendar_sync_tenant_id ON booking_calendar_sync(tenant_id);
```

---

## Implementation Plan

### Phase 1: Google Calendar Integration (Week 1)

**Step 1: Set up Google OAuth**

```typescript
// src/lib/calendar/google-calendar.ts
import { google } from 'googleapis'

export class GoogleCalendarClient {
  private oauth2Client: any
  
  constructor(refreshToken: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
    
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    })
  }
  
  async createEvent(booking: DemoBooking): Promise<string> {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
    
    const event = {
      summary: `Demo Booking: ${booking.customerName}`,
      description: `
        Customer: ${booking.customerName}
        Email: ${booking.customerEmail}
        Phone: ${booking.customerPhone}
        Location: ${booking.locationName}
        Price: R${booking.price}
        ${booking.message ? `Message: ${booking.message}` : ''}
      `.trim(),
      location: booking.locationName,
      start: {
        dateTime: this.parseBookingDateTime(booking.date, booking.timeSlot),
        timeZone: 'Africa/Johannesburg',
      },
      end: {
        dateTime: this.parseBookingDateTime(booking.date, booking.timeSlot, 60), // 1 hour duration
        timeZone: 'Africa/Johannesburg',
      },
      attendees: [
        { email: booking.customerEmail },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    }
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      sendUpdates: 'all', // Send email notifications
    })
    
    return response.data.id!
  }
  
  async updateEvent(eventId: string, status: BookingStatus): Promise<void> {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
    
    if (status === 'cancelled' || status === 'rejected') {
      // Delete the event
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all',
      })
    } else if (status === 'confirmed') {
      // Update event to confirmed
      await calendar.events.patch({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: {
          summary: `✅ Confirmed: Demo Booking`,
          colorId: '10', // Green color
        },
        sendUpdates: 'all',
      })
    }
  }
  
  private parseBookingDateTime(date: string, timeSlot: string, addMinutes: number = 0): string {
    // Parse "10:00 AM - 11:00 AM" format
    const startTime = timeSlot.split(' - ')[0]
    const [time, period] = startTime.split(' ')
    let [hours, minutes] = time.split(':').map(Number)
    
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    
    const dateTime = new Date(date)
    dateTime.setHours(hours, minutes + addMinutes, 0, 0)
    
    return dateTime.toISOString()
  }
}
```

**Step 2: Create OAuth flow for tenant setup**

```typescript
// src/app/api/calendar/google/auth/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ]
  
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force to get refresh token
  })
  
  return NextResponse.redirect(url)
}
```


