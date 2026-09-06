'use client';

import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  analyserNode: AnalyserNode | null;
  isRecording: boolean;
  className?: string;
}

export function AudioWaveform({ analyserNode, isRecording, className = '' }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationId = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (isRecording && analyserNode) {
        analyserNode.getByteFrequencyData(dataArray);

        const barWidth = (width / (bufferLength / 2)) * 1.8;
        let x = 0;

        for (let i = 0; i < bufferLength / 2; i++) {
          const barHeight = Math.max(4, (dataArray[i]! / 255) * (height - 8));

          // Gradient from Indigo to Cyan
          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, '#6366f1'); // Indigo-500
          gradient.addColorStop(0.5, '#818cf8'); // Indigo-400
          gradient.addColorStop(1, '#06b6d4'); // Cyan-500

          ctx.fillStyle = gradient;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';

          // Centered rounded bars
          const y = (height - barHeight) / 2;
          ctx.beginPath();
          ctx.roundRect(x, y, Math.max(2, barWidth - 2), barHeight, 3);
          ctx.fill();

          x += barWidth + 1;
        }
      } else {
        // Idle animated flat pulse line
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyserNode, isRecording]);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-slate-900/60 p-2 border border-slate-800 ${className}`}>
      <canvas
        ref={canvasRef}
        width={360}
        height={64}
        className="w-full h-16 max-w-sm"
      />
    </div>
  );
}
