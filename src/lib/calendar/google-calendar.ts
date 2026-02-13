/**
 * Google Calendar Integration
 * 
 * Implements Google Calendar API for booking sync
 */

import { google } from 'googleapis'
import type {
  CalendarService,
  OAuthAuthorizationUrl,
  OAuthTokens,
  SyncResult,
  Booking,
  CalendarEvent,
} from './types'

export class GoogleCalendarService implements CalendarService {
  readonly provider = 'google' as const
  
  private oauth2Client: any
  
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      process.env.GOOGLE_CALENDAR_REDIRECT_URI
    )
  }
  
  /**
   * Get OAuth authorization URL
   */
  async getAuthorizationUrl(tenantId: string): Promise<OAuthAuthorizationUrl> {
    const state = Buffer.from(JSON.stringify({ tenantId, provider: 'google' })).toString('base64')
    
    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
      state,
      prompt: 'consent', // Force consent to get refresh token
    })
    
    return { url, state }
  }
  
  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, state: string): Promise<OAuthTokens> {
    const { tokens } = await this.oauth2Client.getToken(code)
    
    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiresAt: new Date(tokens.expiry_date!),
      scope: tokens.scope!,
    }
  }
  
  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken })
    const { credentials } = await this.oauth2Client.refreshAccessToken()
    
    return {
      accessToken: credentials.access_token!,
      refreshToken: credentials.refresh_token || refreshToken,
      expiresAt: new Date(credentials.expiry_date!),
      scope: credentials.scope!,
    }
  }
  
  /**
   * Create calendar event
   */
  async createEvent(booking: Booking, tokens: OAuthTokens): Promise<SyncResult> {
    try {
      this.oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      })
      
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
      
      const event = {
        summary: `Demo Booking - ${booking.customerName}`,
        description: `Booking for ${booking.locationName}\n\nCustomer: ${booking.customerName}\nEmail: ${booking.customerEmail}\nPhone: ${booking.customerPhone || 'N/A'}\n\nNotes: ${booking.notes || 'None'}`,
        location: booking.locationAddress || booking.locationName,
        start: {
          dateTime: this.combineDateTime(booking.date, booking.startTime),
          timeZone: 'Africa/Johannesburg',
        },
        end: {
          dateTime: this.combineDateTime(booking.date, booking.endTime),
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
        sendUpdates: 'all',
      })
      
      return {
        success: true,
        eventId: response.data.id!,
        provider: 'google',
      }
    } catch (error: any) {
      console.error('Google Calendar create event error:', error)
      return {
        success: false,
        error: error.message,
        provider: 'google',
      }
    }
  }
  
  /**
   * Update calendar event
   */
  async updateEvent(eventId: string, booking: Booking, tokens: OAuthTokens): Promise<SyncResult> {
    try {
      this.oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      })
      
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
      
      const event = {
        summary: `Demo Booking - ${booking.customerName} [${booking.status.toUpperCase()}]`,
        description: `Booking for ${booking.locationName}\n\nStatus: ${booking.status}\nCustomer: ${booking.customerName}\nEmail: ${booking.customerEmail}\nPhone: ${booking.customerPhone || 'N/A'}\n\nNotes: ${booking.notes || 'None'}`,
        location: booking.locationAddress || booking.locationName,
        start: {
          dateTime: this.combineDateTime(booking.date, booking.startTime),
          timeZone: 'Africa/Johannesburg',
        },
        end: {
          dateTime: this.combineDateTime(booking.date, booking.endTime),
          timeZone: 'Africa/Johannesburg',
        },
      }
      
      await calendar.events.update({
        calendarId: 'primary',
        eventId,
        requestBody: event,
        sendUpdates: 'all',
      })
      
      return {
        success: true,
        eventId,
        provider: 'google',
      }
    } catch (error: any) {
      console.error('Google Calendar update event error:', error)
      return {
        success: false,
        error: error.message,
        provider: 'google',
      }
    }
  }
  
  /**
   * Delete calendar event
   */
  async deleteEvent(eventId: string, tokens: OAuthTokens): Promise<SyncResult> {
    try {
      this.oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      })

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

      await calendar.events.delete({
        calendarId: 'primary',
        eventId,
        sendUpdates: 'all',
      })

      return {
        success: true,
        eventId,
        provider: 'google',
      }
    } catch (error: any) {
      console.error('Google Calendar delete event error:', error)
      return {
        success: false,
        error: error.message,
        provider: 'google',
      }
    }
  }

  /**
   * Get calendar event
   */
  async getEvent(eventId: string, tokens: OAuthTokens): Promise<CalendarEvent | null> {
    try {
      this.oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      })

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

      const response = await calendar.events.get({
        calendarId: 'primary',
        eventId,
      })

      const event = response.data

      return {
        id: event.id!,
        provider: 'google',
        title: event.summary || '',
        description: event.description || undefined,
        location: event.location || undefined,
        startTime: new Date(event.start?.dateTime || event.start?.date || ''),
        endTime: new Date(event.end?.dateTime || event.end?.date || ''),
        attendees: event.attendees?.map(a => a.email!).filter(Boolean),
        metadata: event,
      }
    } catch (error: any) {
      console.error('Google Calendar get event error:', error)
      return null
    }
  }

  /**
   * Check for conflicts
   */
  async checkConflicts(startTime: Date, endTime: Date, tokens: OAuthTokens): Promise<boolean> {
    try {
      this.oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      })

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      })

      // If there are any events in this time range, there's a conflict
      return (response.data.items?.length || 0) > 0
    } catch (error: any) {
      console.error('Google Calendar check conflicts error:', error)
      return false
    }
  }

  /**
   * Helper: Combine date and time strings
   */
  private combineDateTime(date: Date, time: string): string {
    const dateStr = date.toISOString().split('T')[0]
    return `${dateStr}T${time}:00`
  }
}

