'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom right, #fee2e2, #f3f4f6)',
          padding: '1rem'
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💥</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Critical Error
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              A critical error occurred. Please refresh the page or contact support if the problem persists.
            </p>
            {error.digest && (
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace', marginBottom: '2rem' }}>
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#2563eb',
                color: 'white',
                fontWeight: '600',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
