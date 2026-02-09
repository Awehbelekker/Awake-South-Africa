/**
 * OAuth Types and Interfaces
 * 
 * For Google and Microsoft OAuth 2.0 integration
 */

export type OAuthProvider = 'google' | 'microsoft'

export interface OAuthConfig {
  provider: OAuthProvider
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

export interface OAuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt: Date
  scope: string
  tokenType: string
}

export interface OAuthUserInfo {
  id: string
  email: string
  name: string
  picture?: string
  provider: OAuthProvider
}

export interface OAuthConnection {
  id: string
  tenantId: string
  userId: string
  provider: OAuthProvider
  accessToken: string
  refreshToken?: string
  expiresAt: Date
  scope: string
  userInfo: OAuthUserInfo
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Google OAuth Scopes
 * https://developers.google.com/identity/protocols/oauth2/scopes
 */
export const GOOGLE_SCOPES = {
  // Google Drive
  DRIVE_FILE: 'https://www.googleapis.com/auth/drive.file', // Per-file access
  DRIVE_FULL: 'https://www.googleapis.com/auth/drive', // Full Drive access
  DRIVE_READONLY: 'https://www.googleapis.com/auth/drive.readonly', // Read-only access
  
  // Google Calendar
  CALENDAR: 'https://www.googleapis.com/auth/calendar', // Full calendar access
  CALENDAR_READONLY: 'https://www.googleapis.com/auth/calendar.readonly', // Read-only
  CALENDAR_EVENTS: 'https://www.googleapis.com/auth/calendar.events', // Events only
  
  // User Info
  USERINFO_EMAIL: 'https://www.googleapis.com/auth/userinfo.email',
  USERINFO_PROFILE: 'https://www.googleapis.com/auth/userinfo.profile',
  OPENID: 'openid',
} as const

/**
 * Microsoft OAuth Scopes
 * https://docs.microsoft.com/en-us/graph/permissions-reference
 */
export const MICROSOFT_SCOPES = {
  // OneDrive
  FILES_READ: 'Files.Read',
  FILES_READWRITE: 'Files.ReadWrite',
  FILES_READWRITE_ALL: 'Files.ReadWrite.All',
  
  // Calendar
  CALENDARS_READ: 'Calendars.Read',
  CALENDARS_READWRITE: 'Calendars.ReadWrite',
  
  // User Info
  USER_READ: 'User.Read',
  OPENID: 'openid',
  PROFILE: 'profile',
  EMAIL: 'email',
  OFFLINE_ACCESS: 'offline_access', // Required for refresh tokens
} as const

/**
 * Recommended scope combinations for common use cases
 */
export const OAUTH_SCOPE_PRESETS = {
  google: {
    driveAndCalendar: [
      GOOGLE_SCOPES.DRIVE_FILE,
      GOOGLE_SCOPES.CALENDAR,
      GOOGLE_SCOPES.USERINFO_EMAIL,
      GOOGLE_SCOPES.USERINFO_PROFILE,
      GOOGLE_SCOPES.OPENID,
    ],
    calendarOnly: [
      GOOGLE_SCOPES.CALENDAR,
      GOOGLE_SCOPES.USERINFO_EMAIL,
      GOOGLE_SCOPES.USERINFO_PROFILE,
      GOOGLE_SCOPES.OPENID,
    ],
    driveOnly: [
      GOOGLE_SCOPES.DRIVE_FILE,
      GOOGLE_SCOPES.USERINFO_EMAIL,
      GOOGLE_SCOPES.USERINFO_PROFILE,
      GOOGLE_SCOPES.OPENID,
    ],
  },
  microsoft: {
    oneDriveAndCalendar: [
      MICROSOFT_SCOPES.FILES_READWRITE,
      MICROSOFT_SCOPES.CALENDARS_READWRITE,
      MICROSOFT_SCOPES.USER_READ,
      MICROSOFT_SCOPES.OPENID,
      MICROSOFT_SCOPES.PROFILE,
      MICROSOFT_SCOPES.EMAIL,
      MICROSOFT_SCOPES.OFFLINE_ACCESS,
    ],
    calendarOnly: [
      MICROSOFT_SCOPES.CALENDARS_READWRITE,
      MICROSOFT_SCOPES.USER_READ,
      MICROSOFT_SCOPES.OPENID,
      MICROSOFT_SCOPES.PROFILE,
      MICROSOFT_SCOPES.EMAIL,
      MICROSOFT_SCOPES.OFFLINE_ACCESS,
    ],
    oneDriveOnly: [
      MICROSOFT_SCOPES.FILES_READWRITE,
      MICROSOFT_SCOPES.USER_READ,
      MICROSOFT_SCOPES.OPENID,
      MICROSOFT_SCOPES.PROFILE,
      MICROSOFT_SCOPES.EMAIL,
      MICROSOFT_SCOPES.OFFLINE_ACCESS,
    ],
  },
} as const

