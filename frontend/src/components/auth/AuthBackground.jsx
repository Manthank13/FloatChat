import { useEffect, useRef } from 'react';

export default function AuthBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Subtle atmospheric particulate drift
    const particleCount = Math.min(Math.floor(width / 50), 30);
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speedY: -(Math.random() * 0.18 + 0.05),
      speedX: (Math.random() - 0.5) * 0.1,
      opacity: Math.random() * 0.3 + 0.1,
      color: Math.random() > 0.4 ? '0, 229, 255' : '56, 189, 248'
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="auth-background-container" aria-hidden="true">
      <canvas ref={canvasRef} className="auth-particle-canvas" />

      {/* Atmospheric Radial Gradient Layer */}
      <div className="auth-ambient-glow" />

      {/* Subtle Environmental Contour Lines */}
      <svg className="auth-contour-svg" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <linearGradient id="authContourGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--cyan-primary)" stopOpacity="0.08" />
            <stop offset="60%" stopColor="var(--electric-blue)" stopOpacity="0.03" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M-100 200 C 300 120, 700 320, 1100 220 C 1500 120, 1900 280, 2300 180" fill="none" stroke="url(#authContourGrad)" strokeWidth="1" strokeDasharray="5 8" />
        <path d="M-100 450 C 350 380, 750 540, 1200 460 C 1650 380, 1950 510, 2300 420" fill="none" stroke="url(#authContourGrad)" strokeWidth="1.2" />
        <path d="M-100 700 C 400 620, 800 780, 1250 690 C 1700 600, 2000 750, 2300 660" fill="none" stroke="url(#authContourGrad)" strokeWidth="1" strokeDasharray="3 6" />
      </svg>

      <style>{`
        .auth-background-container {
          position: fixed;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(circle at 50% 20%, var(--bg-deep) 0%, var(--bg-abyss) 100%);
        }

        .auth-particle-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .auth-ambient-glow {
          position: absolute;
          top: -20%;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--cyan-glow) 0%, transparent 70%);
          opacity: 0.35;
          filter: blur(80px);
        }

        .auth-contour-svg {
          position: absolute;
          inset: 0;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
