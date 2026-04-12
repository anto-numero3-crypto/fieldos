import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 18,
            fontWeight: 800,
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '-1px',
          }}
        >
          G
        </div>
      </div>
    ),
    { ...size }
  )
}
