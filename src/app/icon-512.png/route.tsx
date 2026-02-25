import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        }}
      >
        <div
          style={{
            fontSize: 320,
            fontWeight: 'bold',
            color: 'white',
            fontFamily: 'sans-serif',
          }}
        >
          A
        </div>
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  )
}
