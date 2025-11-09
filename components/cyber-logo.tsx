"use client"

export function CyberLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* SVG Icon */}
      <div className="relative">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
        >
          {/* Outer hexagon */}
          <path
            d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
            stroke="url(#gradient1)"
            strokeWidth="1.5"
            fill="none"
            className="animate-pulse"
            style={{ animationDuration: "3s" }}
          />

          {/* Inner triangle */}
          <path
            d="M16 8L24 16L16 24L8 16L16 8Z"
            fill="url(#gradient2)"
            opacity="0.3"
          />

          {/* Center elements - GT letters stylized */}
          <path
            d="M13 13H11V19H13V15H15V13H13Z"
            fill="url(#gradient3)"
          />
          <path
            d="M18 13H21V15H19V19H17V13H18Z"
            fill="url(#gradient3)"
          />

          {/* Scan line effect */}
          <line
            x1="4"
            y1="16"
            x2="28"
            y2="16"
            stroke="url(#gradient4)"
            strokeWidth="0.5"
            opacity="0.6"
            className="animate-pulse"
            style={{ animationDuration: "2s" }}
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="gradient1" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>

            <linearGradient id="gradient2" x1="8" y1="8" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>

            <linearGradient id="gradient3" x1="11" y1="13" x2="21" y2="19" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>

            <linearGradient id="gradient4" x1="4" y1="16" x2="28" y2="16" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>

        {/* Glow effect */}
        <div className="absolute inset-0 blur-sm opacity-50">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
              stroke="#8B5CF6"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* Text */}
      <div className="flex flex-col leading-none">
        <span className="text-base font-bold tracking-wide bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
          GEMINI TERA
        </span>
        <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
          Factory
        </span>
      </div>
    </div>
  )
}
