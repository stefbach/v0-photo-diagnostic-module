import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#164e63',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '50%',
        }}
      >
        🩺
      </div>
    ),
    {
      width: 32,
      height: 32,
    }
  )
}
