// A calm countryside scene for the first screen: sun, hills, a barn, a fence and two cows.
// It is drawn with shapes rather than a photo, so it loads instantly even on a slow connection.
function Cow({ x, y, scale = 1, flip = false }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <rect x="-15" y="8" width="4" height="13" rx="1.5" fill="#fff" stroke="#5b4636" strokeWidth="1.2" />
      <rect x="-5" y="8" width="4" height="13" rx="1.5" fill="#fff" stroke="#5b4636" strokeWidth="1.2" />
      <rect x="8" y="8" width="4" height="13" rx="1.5" fill="#fff" stroke="#5b4636" strokeWidth="1.2" />
      <rect x="16" y="8" width="4" height="13" rx="1.5" fill="#fff" stroke="#5b4636" strokeWidth="1.2" />
      <ellipse cx="2" cy="2" rx="22" ry="13" fill="#fff" stroke="#5b4636" strokeWidth="1.4" />
      <ellipse cx="-6" cy="-3" rx="5.5" ry="4" fill="#5b4636" />
      <ellipse cx="9" cy="6" rx="4.5" ry="3.2" fill="#5b4636" />
      <path d="M22 -2c5-5 11-5 14-1l-1 8c-2 3-8 3-12 0z" fill="#fff" stroke="#5b4636" strokeWidth="1.4" strokeLinejoin="round" />
      <ellipse cx="33" cy="5" rx="3.6" ry="2.6" fill="#f3c3b0" />
      <circle cx="30" cy="0" r="1.1" fill="#3b2d22" />
      <path d="M24 -6l-2-5M31 -7l1-5" stroke="#5b4636" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M-20 -3c-5 2-6 8-4 13" fill="none" stroke="#5b4636" strokeWidth="1.4" strokeLinecap="round" />
    </g>
  )
}

export default function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 600 380" role="img" aria-label="Green hills with a barn, a fence and two cows under a bright sun">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde9b2" />
          <stop offset="1" stopColor="#fbf3dc" />
        </linearGradient>
      </defs>
      <rect width="600" height="380" fill="url(#sky)" />
      <circle cx="468" cy="92" r="64" fill="#f9d77a" opacity=".45" />
      <circle cx="468" cy="92" r="40" fill="#f4b942" />
      <path d="M0 230c90-48 170-48 260-8s190 30 340-30v188H0z" fill="#bcd9a4" />
      <path d="M0 262c110-44 200-30 300 4s200 14 300-22v136H0z" fill="#8fc08a" />
      {/* barn on the middle hill */}
      <g transform="translate(402 176)">
        <path d="M0 40V14L24 -4l24 18v26z" fill="#b5532e" />
        <path d="M0 14L24 -4l24 18" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
        <rect x="16" y="20" width="16" height="20" fill="#7d3a1d" />
        <path d="M16 20l16 20M32 20L16 40" stroke="#fff" strokeWidth="2" />
      </g>
      <path d="M0 312c120-42 230-30 330 0s190 22 270-8v76H0z" fill="#5f9e63" />
      {/* fence */}
      <g stroke="#8a6a49" strokeWidth="5" strokeLinecap="round">
        <path d="M30 316v34M78 310v34M126 306v34M174 304v34M222 304v34M270 306v34" />
        <path d="M22 322l262-18M22 336l262-18" strokeWidth="4" />
      </g>
      <Cow x={380} y={318} scale={1.35} />
      <Cow x={500} y={340} scale={1.1} flip />
      {/* a few birds */}
      <path d="M120 84q8-9 16 0M146 62q7-8 14 0M92 62q6-7 12 0" fill="none" stroke="#6c7a63" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
