/**
 * Calendar Integration Types
 * 
 * Unified types for Google Calendar and Microsoft Calendar integration
 */

// ============================================================================
// Calendar Provider Types
// ============================================================================

export type CalendarProvider = 'google' | 'microsoft'

export interface CalendarEvent {
  id: string
  provider: CalendarProvider
  title: string
  description?: string
  location?: string
  startTime: Date
  endTime: Date
  attendees?: string[]
  metadata?: Record<string, any>
}

export interface CalendarConfig {
  provider: CalendarProvider
  clientId: string
  clientSecret: string
  redirectUri: string
  calendarId?: string
}

// ============================================================================
// OAuth Types
// ============================================================================

export interface OAuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  scope: string
}

export interface OAuthAuthorizationUrl {
  url: string
  state: string
}

// ============================================================================
// Sync Types
// ============================================================================

export interface SyncResult {
  success: boolean
  eventId?: string
  error?: string
  provider: CalendarProvider
}

export interface SyncStatus {
  bookingId: string
  tenantId: string
  googleStatus: 'pending' | 'synced' | 'failed'
  microsoftStatus: 'pending' | 'synced' | 'failed'
  googleEventId?: string
  microsoftEventId?: string
  lastSyncedAt?: Date
  error?: string
}

// ============================================================================
// Booking Types
// ============================================================================

export interface Booking {
  id: string
  tenantId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  locationId: string
  locationName: string
  locationAddress?: string
  date: Date
  startTime: string
  endTime: string
  duration: number // minutes
  price: number
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Calendar Service Interface
// ============================================================================

export interface CalendarService {
  readonly provider: CalendarProvider
  
  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(tenantId: string): Promise<OAuthAuthorizationUrl>
  
  /**
   * Exchange authorization code for tokens
   */
  exchangeCodeForTokens(code: string, state: string): Promise<OAuthTokens>
  
  /**
   * Refresh access token
   */
  refreshAccessToken(refreshToken: string): Promise<OAuthTokens>
  
  /**
   * Create calendar event
   */
  createEvent(booking: Booking, tokens: OAuthTokens): Promise<SyncResult>
  
  /**
   * Update calendar event
   */
  updateEvent(eventId: string, booking: Booking, tokens: OAuthTokens): Promise<SyncResult>
  
  /**
   * Delete calendar event
   */
  deleteEvent(eventId: string, tokens: OAuthTokens): Promise<SyncResult>
  
  /**
   * Get calendar event
   */
  getEvent(eventId: string, tokens: OAuthTokens): Promise<CalendarEvent | null>
  
  /**
   * Check for conflicts
   */
  checkConflicts(startTime: Date, endTime: Date, tokens: OAuthTokens): Promise<boolean>
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface CalendarWebhookEvent {
  id: string
  provider: CalendarProvider
  eventType: 'created' | 'updated' | 'deleted'
  eventId: string
  calendarId: string
  timestamp: Date
  payload: Record<string, any>
}

