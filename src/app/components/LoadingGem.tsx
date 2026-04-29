/**
 * LoadingGem Component
 * 
 * Displays a large, rotating hexagonal gem indicator when sending/receiving data from Databricks.
 * Provides visual feedback during API calls to show that work is in progress.
 * 
 * Location: /components/LoadingGem.tsx
 */

import { hexagon, effects } from '../../styles/cohive-theme';

interface LoadingGemProps {
  message?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

export function LoadingGem({ 
  message = 'Communicating with Databricks...', 
  size = 'xlarge' 
}: LoadingGemProps) {
  
  // Define size dimensions - xlarge is larger than standard hexagons
  const sizeMap = {
    small: { width: 80, height: 80 },
    medium: { width: 120, height: 120 },
    large: { width: 160, height: 160 },
    xlarge: { width: 200, height: 200 },
  };
  
  const dimensions = sizeMap[size];
  
  // Gradient colors for the gem effect (purple/teal theme)
  const gemColors = {
    primary: '#7C3AED',   // Deep violet-purple
    secondary: '#DC2626', // Crimson red
    accent: '#C026D3',    // Vivid magenta-purple
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        {/* Rotating Hexagon Gem */}
        <div 
          className="animate-spin-slow"
          style={{ 
            width: dimensions.width, 
            height: dimensions.height,
            animation: 'spin 3s linear infinite'
          }}
        >
          <svg
            viewBox="0 0 200 165"
            className="w-full h-full"
            style={{ 
              filter: 'drop-shadow(0 20px 40px rgba(139, 92, 246, 0.4)) drop-shadow(0 0 30px rgba(10, 120, 170, 0.3))',
            }}
          >
            <defs>
              {/* Multi-stop gradient for gem effect */}
              <linearGradient id="gemGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: gemColors.primary, stopOpacity: 1 }}>
                  <animate attributeName="stop-color"
                    values="#7C3AED;#DC2626;#C026D3;#9333EA;#7C3AED"
                    dur="4s"
                    repeatCount="indefinite" />
                </stop>
                <stop offset="40%" style={{ stopColor: '#B91C1C', stopOpacity: 0.95 }}>
                  <animate attributeName="stop-color"
                    values="#B91C1C;#C026D3;#7C3AED;#DC2626;#B91C1C"
                    dur="4s"
                    repeatCount="indefinite" />
                </stop>
                <stop offset="70%" style={{ stopColor: gemColors.accent, stopOpacity: 0.9 }}>
                  <animate attributeName="stop-color"
                    values="#C026D3;#7C3AED;#DC2626;#BE185D;#C026D3"
                    dur="4s"
                    repeatCount="indefinite" />
                </stop>
                <stop offset="100%" style={{ stopColor: '#9333EA', stopOpacity: 0.85 }}>
                  <animate attributeName="stop-color"
                    values="#9333EA;#BE185D;#C026D3;#7C3AED;#9333EA"
                    dur="4s"
                    repeatCount="indefinite" />
                </stop>
              </linearGradient>
              
              {/* Radial gradient for inner glow */}
              <radialGradient id="gemGlow">
                <stop offset="0%" style={{ stopColor: '#FEF08A', stopOpacity: 1.0 }} />
                <stop offset="45%" style={{ stopColor: '#FACC15', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#EAB308', stopOpacity: 0.2 }} />
              </radialGradient>
              
              {/* Inner shadow for depth */}
              <filter id="gemInnerShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="0" dy="2" result="offsetblur"/>
                <feFlood floodColor="#000000" floodOpacity="0.5"/>
                <feComposite in2="offsetblur" operator="in"/>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Hexagon path - elongated horizontal hexagon */}
            <path
              d="M 50 0 L 150 0 L 200 82.5 L 150 165 L 50 165 L 0 82.5 Z"
              fill="url(#gemGradient)"
              stroke="url(#gemGradient)"
              strokeWidth="3"
              filter="url(#gemInnerShadow)"
              opacity="0.95"
            />
            
            {/* Inner hexagon for facet effect */}
            <path
              d="M 70 25 L 130 25 L 165 82.5 L 130 140 L 70 140 L 35 82.5 Z"
              fill="url(#gemGlow)"
              opacity="0.3"
            />
            
            {/* Highlight streak for gem shine */}
            <path
              d="M 80 15 L 120 15 L 100 82.5 Z"
              fill="white"
              opacity="0.4"
            >
              <animate attributeName="opacity" 
                values="0.2;0.6;0.2" 
                dur="2s" 
                repeatCount="indefinite" />
            </path>
          </svg>
        </div>
        
        {/* Loading Message */}
        <div className="text-center space-y-2">
          <p className="text-white text-xl font-semibold tracking-wide">
            {message}
          </p>
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * SpinHex — small inline rotating hex spinner.
 * Drop-in replacement for Loader2, Loader, Cpu, or gemIcon animate-spin.
 * Size is controlled via className (e.g. "w-4 h-4", "w-6 h-6", "w-10 h-10").
 */
export function SpinHex({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 165"
      className={className}
      style={{ animation: 'spinHex 2s linear infinite', flexShrink: 0 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="spinHexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#7C3AED" />
          <stop offset="35%"  stopColor="#DC2626" />
          <stop offset="65%"  stopColor="#C026D3" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
        <radialGradient id="spinHexGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FEF08A" stopOpacity="1.0" />
          <stop offset="45%"  stopColor="#FACC15" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#EAB308" stopOpacity="0.1" />
        </radialGradient>
      </defs>
      {/* Outer hex */}
      <path d="M 50 0 L 150 0 L 200 82.5 L 150 165 L 50 165 L 0 82.5 Z"
            fill="url(#spinHexGrad)" />
      {/* Red facet top-right */}
      <path d="M 100 0 L 200 82.5 L 100 82.5 Z"
            fill="#B91C1C" opacity="0.35" />
      {/* Purple facet bottom-left */}
      <path d="M 0 82.5 L 100 82.5 L 50 165 Z"
            fill="#9333EA" opacity="0.35" />
      {/* Yellow inner glow */}
      <path d="M 70 25 L 130 25 L 165 82.5 L 130 140 L 70 140 L 35 82.5 Z"
            fill="url(#spinHexGlow)" opacity="0.6" />
      <style>{`
        @keyframes spinHex {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}
