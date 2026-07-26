import React, { useEffect, useRef, useState } from 'react';

interface InteractiveCursorLightingProps {
  activeThemeKey?: string;
  darkMode?: boolean;
}

export const InteractiveCursorLighting: React.FC<InteractiveCursorLightingProps> = ({
  activeThemeKey = 'cyan',
  darkMode = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hoverType, setHoverType] = useState<'button' | 'card' | 'input' | 'default'>('default');

  // Motion reduced preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Refs for animation frame and physics lerp
  const animFrameId = useRef<number | null>(null);

  // Targets (raw mouse)
  const targetPos = useRef({ x: -1000, y: -1000 });

  // Interpolated positions for multi-layered parallax lighting
  const corePos = useRef({ x: -1000, y: -1000 });
  const midPos = useRef({ x: -1000, y: -1000 });
  const outerPos = useRef({ x: -1000, y: -1000 });

  // Interpolated scale & intensity
  const currentScale = useRef(1);
  const targetScale = useRef(1);

  // DOM elements refs for direct GPU transform updates (avoids React re-render overhead)
  const coreRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Accessibility check
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Helper function for linear interpolation
    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    const handlePointerMove = (e: PointerEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };

      if (!isVisible) setIsVisible(true);

      // Check hovered element
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactiveEl = target.closest(
          'button, a, input, textarea, select, [role="button"], .cursor-pointer, .interactive-card, card'
        );

        if (interactiveEl) {
          setIsHovered(true);
          if (interactiveEl.tagName === 'BUTTON' || interactiveEl.tagName === 'A') {
            setHoverType('button');
            targetScale.current = 1.6;
          } else if (interactiveEl.tagName === 'INPUT' || interactiveEl.tagName === 'TEXTAREA') {
            setHoverType('input');
            targetScale.current = 1.25;
          } else {
            setHoverType('card');
            targetScale.current = 1.45;
          }
        } else {
          setIsHovered(false);
          setHoverType('default');
          targetScale.current = 1.0;
        }

        // Card Spotlight effect: update CSS variables on cards near the cursor
        const cards = document.querySelectorAll<HTMLElement>('.spotlight-card, [data-spotlight="true"]');
        cards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          card.style.setProperty('--mouse-x', `${x}px`);
          card.style.setProperty('--mouse-y', `${y}px`);
        });
      }
    };

    const handlePointerDown = () => {
      setIsMouseDown(true);
      targetScale.current = 0.85;
    };

    const handlePointerUp = () => {
      setIsMouseDown(false);
      targetScale.current = isHovered ? 1.5 : 1.0;
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Animation Loop using requestAnimationFrame
    const updatePhysics = () => {
      const targetX = targetPos.current.x;
      const targetY = targetPos.current.y;

      if (prefersReducedMotion) {
        corePos.current = { x: targetX, y: targetY };
        midPos.current = { x: targetX, y: targetY };
        outerPos.current = { x: targetX, y: targetY };
        currentScale.current = targetScale.current;
      } else {
        // Different lerp speeds for layered depth & spring inertia
        corePos.current.x = lerp(corePos.current.x, targetX, 0.45);
        corePos.current.y = lerp(corePos.current.y, targetY, 0.45);

        midPos.current.x = lerp(midPos.current.x, targetX, 0.18);
        midPos.current.y = lerp(midPos.current.y, targetY, 0.18);

        outerPos.current.x = lerp(outerPos.current.x, targetX, 0.08);
        outerPos.current.y = lerp(outerPos.current.y, targetY, 0.08);

        currentScale.current = lerp(currentScale.current, targetScale.current, 0.15);
      }

      // Direct GPU Transform updates
      const s = currentScale.current;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${corePos.current.x}px, ${corePos.current.y}px, 0px) translate(-50%, -50%) scale(${s})`;
      }

      if (coreRef.current) {
        coreRef.current.style.transform = `translate3d(${corePos.current.x}px, ${corePos.current.y}px, 0px) translate(-50%, -50%) scale(${s})`;
      }

      if (midRef.current) {
        midRef.current.style.transform = `translate3d(${midPos.current.x}px, ${midPos.current.y}px, 0px) translate(-50%, -50%) scale(${s * 1.1})`;
      }

      if (outerRef.current) {
        outerRef.current.style.transform = `translate3d(${outerPos.current.x}px, ${outerPos.current.y}px, 0px) translate(-50%, -50%) scale(${s * 1.2})`;
      }

      animFrameId.current = requestAnimationFrame(updatePhysics);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    animFrameId.current = requestAnimationFrame(updatePhysics);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);

      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [isVisible, isHovered, prefersReducedMotion]);

  // Color profiles based on active theme
  const getThemeGradients = () => {
    switch (activeThemeKey) {
      case 'cyan':
        return {
          core: 'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(6, 182, 212, 0.6) 35%, transparent 70%)',
          mid: 'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(59, 130, 246, 0.15) 50%, transparent 80%)',
          outer: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.03) 60%, transparent 90%)',
          ring: 'border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.6)]',
        };
      case 'purple':
        return {
          core: 'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(168, 85, 247, 0.6) 35%, transparent 70%)',
          mid: 'radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, rgba(236, 72, 153, 0.15) 50%, transparent 80%)',
          outer: 'radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, rgba(168, 85, 247, 0.03) 60%, transparent 90%)',
          ring: 'border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.6)]',
        };
      case 'emerald':
        return {
          core: 'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(16, 185, 129, 0.6) 35%, transparent 70%)',
          mid: 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(6, 182, 212, 0.15) 50%, transparent 80%)',
          outer: 'radial-gradient(circle, rgba(5, 150, 105, 0.1) 0%, rgba(16, 185, 129, 0.03) 60%, transparent 90%)',
          ring: 'border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.6)]',
        };
      case 'amber':
        return {
          core: 'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(245, 158, 11, 0.6) 35%, transparent 70%)',
          mid: 'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, rgba(234, 88, 12, 0.15) 50%, transparent 80%)',
          outer: 'radial-gradient(circle, rgba(217, 119, 6, 0.1) 0%, rgba(245, 158, 11, 0.03) 60%, transparent 90%)',
          ring: 'border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.6)]',
        };
      case 'monochrome':
      default:
        return {
          core: 'radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.5) 30%, transparent 70%)',
          mid: 'radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, rgba(200, 200, 200, 0.08) 50%, transparent 80%)',
          outer: 'radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, rgba(180, 180, 180, 0.02) 60%, transparent 90%)',
          ring: 'border-white/80 shadow-[0_0_20px_rgba(255,255,255,0.7)]',
        };
    }
  };

  const gradients = getThemeGradients();

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-40 overflow-hidden transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* 1. Precision Cursor Follower Ring / Interactive Target Indicator */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 w-8 h-8 rounded-full border transition-all duration-150 ease-out flex items-center justify-center ${
          gradients.ring
        } ${
          isHovered
            ? 'scale-150 bg-white/10 border-white backdrop-blur-[1px]'
            : 'scale-100 bg-transparent'
        }`}
        style={{
          willChange: 'transform',
        }}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
            isHovered ? 'bg-white scale-125' : 'bg-white/80'
          }`}
        />
      </div>

      {/* 2. Core High-Intensity Focal Beam */}
      <div
        ref={coreRef}
        className="fixed top-0 left-0 w-40 h-40 rounded-full blur-lg opacity-80 mix-blend-screen"
        style={{
          background: gradients.core,
          willChange: 'transform',
        }}
      />

      {/* 3. Mid-Range Illuminated Ambient Light Field */}
      <div
        ref={midRef}
        className="fixed top-0 left-0 w-[550px] h-[550px] rounded-full blur-2xl opacity-75 mix-blend-screen"
        style={{
          background: gradients.mid,
          willChange: 'transform',
        }}
      />

      {/* 4. Outer Deep Parallax Atmosphere Halo */}
      <div
        ref={outerRef}
        className="fixed top-0 left-0 w-[950px] h-[950px] rounded-full blur-3xl opacity-60 mix-blend-screen"
        style={{
          background: gradients.outer,
          willChange: 'transform',
        }}
      />
    </div>
  );
};
