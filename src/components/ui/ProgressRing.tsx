"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface ProgressRingProps {
  ratio: number; // 0..1
  size?: number;
  stroke?: number;
  color: string;
  /** Optional second stop for a subtle gradient sweep. */
  colorTo?: string;
  trackColor?: string;
  /** Soft drop shadow under the progress arc (Apple-ring polish). */
  shadow?: boolean;
  children?: React.ReactNode;
}

/**
 * A premium circular progress ring: consistent stroke, rounded caps, an
 * optional gradient + soft shadow, and a smoothly eased draw that re-animates
 * whenever `ratio` changes. Centered content stays perfectly centered at any
 * value. Honors reduced-motion.
 */
export function ProgressRing({
  ratio,
  size = 44,
  stroke = 3,
  color,
  colorTo,
  trackColor = "#ECECEC",
  shadow = false,
  children,
}: ProgressRingProps) {
  const uid = useId().replace(/[:]/g, "");
  const gradId = `ring-grad-${uid}`;
  const shadowId = `ring-shadow-${uid}`;
  const reduce = useReducedMotion();

  // Pad so rounded caps + shadow never clip against the SVG bounds.
  const pad = shadow ? Math.ceil(stroke * 0.9) : 0;
  const box = size + pad * 2;
  const c = box / 2;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, ratio));
  const strokeValue = colorTo ? `url(#${gradId})` : color;
  const target = circumference * (1 - clamped);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`}>
        <defs>
          {colorTo && (
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={colorTo} />
            </linearGradient>
          )}
          {shadow && (
            <filter id={shadowId} x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow
                dx="0"
                dy="1.5"
                stdDeviation="2"
                floodColor={color}
                floodOpacity="0.35"
              />
            </filter>
          )}
        </defs>

        <g transform={`rotate(-90 ${c} ${c})`}>
          <circle
            cx={c}
            cy={c}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={stroke}
          />
          <motion.circle
            cx={c}
            cy={c}
            r={radius}
            fill="none"
            stroke={strokeValue}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            filter={shadow ? `url(#${shadowId})` : undefined}
            initial={reduce ? false : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: target }}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
            }
          />
        </g>
      </svg>
      {children && (
        <span className="absolute inset-0 flex items-center justify-center">
          {children}
        </span>
      )}
    </div>
  );
}
