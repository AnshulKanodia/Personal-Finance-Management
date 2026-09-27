"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
  twinkleSpeed: number;
}

export const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener("resize", handleResize);

    // Generate stars
    const starCount = Math.floor((width * height) / 8000); // Responsive density (~100-150 stars)
    let stars: Star[] = [];

    const initStars = () => {
      stars = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.5 + 0.5, // 0.5px to 2px
          alpha: Math.random() * 0.7 + 0.2, // 0.2 to 0.9 opacity
          speed: Math.random() * 0.15 + 0.05, // Slow, elegant drift
          twinkleSpeed: Math.random() * 0.02 + 0.005,
        });
      }
    };

    initStars();

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Draw and animate stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Slow upward drift
        star.y -= star.speed;
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }

        // Gentle twinkling
        const currentAlpha =
          star.alpha + Math.sin(frame * star.twinkleSpeed + i) * 0.25;
        const clampedAlpha = Math.max(0.1, Math.min(0.95, currentAlpha));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${clampedAlpha})`;
        ctx.shadowBlur = star.size > 1.2 ? 4 : 0;
        ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
};
