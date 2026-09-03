import { useEffect, useRef } from 'react';

export default function OceanBackground() {
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

    // Particle pool (Bioluminescent plankton & ocean particulates)
    const particleCount = Math.min(Math.floor(width / 40), 38);
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.6 + 0.6,
      speedY: -(Math.random() * 0.22 + 0.06), // Very slow, calm upward drift
      speedX: (Math.random() - 0.5) * 0.12,
      opacity: Math.random() * 0.35 + 0.1,
      pulseSpeed: Math.random() * 0.015 + 0.005,
      pulseVal: Math.random() * Math.PI,
      colorDark: Math.random() > 0.35 ? '0, 229, 255' : '56, 189, 248',
      colorLight: Math.random() > 0.35 ? '2, 132, 199' : '14, 165, 233'
    }));

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.pulseVal += p.pulseSpeed;

        const currentOpacity = p.opacity * (0.65 + 0.35 * Math.sin(p.pulseVal)) * (isLight ? 0.7 : 1);
        const color = isLight ? p.colorLight : p.colorDark;

        // Wrap around screen
        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${currentOpacity})`;
        if (!isLight) {
          ctx.shadowColor = `rgba(${color}, 0.45)`;
          ctx.shadowBlur = 5;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
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
    <div className="ocean-environment-layer" aria-hidden="true">
      {/* Deep Ocean / Crisp Daylight Atmospheric Gradient */}
      <div className="ocean-depth-gradient" />

      {/* Volumetric Sunlight / Bioluminescent Light Rays */}
      <div className="ocean-light-rays">
        <div className="light-ray ray-1" />
        <div className="light-ray ray-2" />
        <div className="light-ray ray-3" />
      </div>

      {/* Subtle Bathymetric Depth Contours */}
      <svg className="ocean-bathymetry-svg" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <linearGradient id="bathyGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.04" />
            <stop offset="50%" stopColor="#0284C7" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#040D1E" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bathyGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" stopOpacity="0.08" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#F4F7FB" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 240 C 320 180, 640 310, 1020 250 C 1420 190, 1720 290, 2200 230" fill="none" className="bathy-path" strokeWidth="1.2" strokeDasharray="6 10" />
        <path d="M0 480 C 380 420, 720 550, 1140 480 C 1520 410, 1840 510, 2200 450" fill="none" className="bathy-path" strokeWidth="1" />
        <path d="M0 720 C 340 650, 820 770, 1220 700 C 1620 630, 1920 740, 2200 680" fill="none" className="bathy-path" strokeWidth="1" strokeDasharray="4 8" />
      </svg>

      {/* Floating Particulate Canvas */}
      <canvas ref={canvasRef} className="ocean-particles-canvas" />

      <style>{`
        .ocean-environment-layer {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
          background-color: var(--bg-abyss);
        }

        /* Dark Theme Atmosphere */
        .ocean-depth-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 0%, rgba(2, 132, 199, 0.16) 0%, rgba(4, 13, 30, 0.92) 55%, #020611 100%);
          transition: background 0.3s ease;
        }

        .ocean-light-rays {
          position: absolute;
          top: -15%;
          left: 10%;
          width: 80%;
          height: 70%;
          display: flex;
          justify-content: space-around;
          opacity: 0.35;
          pointer-events: none;
        }

        .light-ray {
          width: 140px;
          height: 100%;
          background: linear-gradient(180deg, rgba(0, 229, 255, 0.14) 0%, rgba(2, 132, 199, 0.03) 65%, transparent 100%);
          filter: blur(32px);
          transform: rotate(-10deg);
        }

        .ray-1 {
          animation: lightRayDrift 10s ease-in-out infinite;
        }

        .ray-2 {
          animation: lightRayDrift 14s ease-in-out infinite 2s;
          width: 180px;
        }

        .ray-3 {
          animation: lightRayDrift 12s ease-in-out infinite 4s;
          width: 110px;
        }

        .ocean-bathymetry-svg {
          position: absolute;
          inset: 0;
          opacity: 0.8;
          pointer-events: none;
        }

        .bathy-path {
          stroke: url(#bathyGradDark);
        }

        .ocean-particles-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        /* LIGHT THEME SPECIFIC OVERRIDES */
        [data-theme="light"] .ocean-depth-gradient {
          background: radial-gradient(circle at 50% -10%, rgba(186, 230, 253, 0.35) 0%, rgba(240, 249, 255, 0.6) 35%, #F4F7FB 100%);
        }

        [data-theme="light"] .ocean-light-rays {
          opacity: 0.25;
        }

        [data-theme="light"] .light-ray {
          background: linear-gradient(180deg, rgba(2, 132, 199, 0.08) 0%, rgba(56, 189, 248, 0.02) 65%, transparent 100%);
        }

        [data-theme="light"] .bathy-path {
          stroke: url(#bathyGradLight);
        }

        [data-theme="light"] .ocean-bathymetry-svg {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}
