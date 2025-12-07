import React, { useState, useEffect } from 'react';
import { Gamepad2 } from 'lucide-react';

const RoamingPet: React.FC = () => {
  const [position, setPosition] = useState({ x: 50, y: 50 }); // Start in center
  const [direction, setDirection] = useState(1); // 1 = facing right, -1 = facing left
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    let moveTimeout: ReturnType<typeof setTimeout>;

    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 1.5; // Movement step size

      // Only prevent default scrolling if arrows are used
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        setIsMoving(true);
        clearTimeout(moveTimeout);
        // Stop animation shortly after key release simulation
        moveTimeout = setTimeout(() => setIsMoving(false), 150);

        setPosition((prev) => {
          let newX = prev.x;
          let newY = prev.y;

          switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
              newY = Math.max(0, prev.y - step);
              break;
            case 'ArrowDown':
            case 's':
            case 'S':
              newY = Math.min(100, prev.y + step);
              break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
              newX = Math.max(0, prev.x - step);
              setDirection(-1);
              break;
            case 'ArrowRight':
            case 'd':
            case 'D':
              newX = Math.min(100, prev.x + step);
              setDirection(1);
              break;
            default:
              return prev;
          }
          return { x: newX, y: newY };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(moveTimeout);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-30 pointer-events-none overflow-hidden"
    >
      <div 
        className="absolute transition-transform duration-100 ease-linear flex flex-col items-center"
        style={{ 
          left: `${position.x}%`, 
          top: `${position.y}%`,
          transform: `translate(-50%, -50%)`,
        }}
      >
        <div className="relative group">
          {/* Custom Cute Dog SVG */}
          <div 
            className={`w-24 h-24 drop-shadow-xl transition-transform duration-200 ${isMoving ? 'animate-bounce-run' : 'animate-breathe'}`}
            style={{ transform: `scaleX(${direction})` }}
          >
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* Tail */}
              <path d="M15 45 Q 10 30 15 20" stroke="#ea580c" strokeWidth="6" strokeLinecap="round" className={`${isMoving ? 'animate-wiggle' : ''}`}>
                <animate attributeName="d" values="M15 45 Q 10 30 15 20; M15 45 Q 20 30 15 20; M15 45 Q 10 30 15 20" dur="0.5s" repeatCount="indefinite" />
              </path>

              {/* Back Legs */}
              <ellipse cx="30" cy="75" rx="6" ry="10" fill="#c2410c" />
              <ellipse cx="70" cy="75" rx="6" ry="10" fill="#c2410c" />

              {/* Body */}
              <rect x="20" y="40" width="60" height="35" rx="15" fill="#f97316" />
              {/* Belly Patch */}
              <path d="M25 60 Q 50 75 75 60 L 75 65 Q 50 80 25 65 Z" fill="#ffedd5" />

              {/* Front Legs */}
              <ellipse cx="35" cy="78" rx="5" ry="8" fill="#fb923c" />
              <ellipse cx="65" cy="78" rx="5" ry="8" fill="#fb923c" />

              {/* Head Group */}
              <g transform="translate(60, 25)">
                {/* Ears */}
                <path d="M5 -5 L 15 -15 L 20 0 Z" fill="#c2410c" />
                <path d="M25 -5 L 35 -15 L 30 5 Z" fill="#c2410c" />
                
                {/* Head Shape */}
                <circle cx="20" cy="10" r="18" fill="#f97316" />
                
                {/* Face Patch */}
                <path d="M10 15 Q 20 25 30 15 Q 25 5 20 5 Q 15 5 10 15" fill="#ffedd5" />

                {/* Eyes */}
                <circle cx="14" cy="10" r="2.5" fill="#1f2937" />
                <circle cx="26" cy="10" r="2.5" fill="#1f2937" />
                {/* Shine in eyes */}
                <circle cx="15" cy="9" r="0.8" fill="white" />
                <circle cx="27" cy="9" r="0.8" fill="white" />

                {/* Nose */}
                <ellipse cx="20" cy="16" rx="3" ry="2" fill="#374151" />
                
                {/* Tongue (optional, nice touch) */}
                <path d="M18 20 Q 20 24 22 20" fill="#ef4444" opacity="0.8" />
              </g>

              {/* Collar */}
              <rect x="62" y="42" width="4" height="12" rx="2" fill="#ef4444" transform="rotate(-15 64 48)" />
              <circle cx="65" cy="52" r="3" fill="#fbbf24" />
            </svg>
          </div>

          {/* Name Tag */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white/90 text-orange-600 text-xs px-2 py-0.5 rounded-full border-2 border-orange-300 font-bold whitespace-nowrap shadow-md">
            My 🐶
          </div>
          
          {/* Controls hint */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 backdrop-blur text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none">
            Use Arrow Keys
          </div>
        </div>
      </div>

      {/* Helper text in corner */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs text-gray-500 bg-white/50 px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-auto shadow-sm">
        <Gamepad2 size={16} />
        <span>Di chuyển "My" bằng phím mũi tên</span>
      </div>
      
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        .animate-wiggle {
          transform-origin: 15px 45px;
          animation: wiggle 0.3s ease-in-out infinite;
        }
        @keyframes bounce-run {
          0%, 100% { transform: translateY(0) scaleX(var(--scale-x, 1)); }
          50% { transform: translateY(-5px) scaleX(var(--scale-x, 1)); }
        }
        .animate-bounce-run {
          animation: bounce-run 0.3s infinite;
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1) scaleX(var(--scale-x, 1)); }
          50% { transform: scale(1.02) scaleX(var(--scale-x, 1)); }
        }
        .animate-breathe {
          animation: breathe 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default RoamingPet;