"use client";

import React, { useRef, useEffect } from 'react';

interface SiriWaveformProps {
  audioStream: MediaStream | null;
  isPlaying: boolean;
}

const SiriWaveform: React.FC<SiriWaveformProps> = ({ audioStream, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying || !audioStream) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
    }

    if (!analyserRef.current) return;

    const source = audioContextRef.current.createMediaStreamSource(audioStream);
    source.connect(analyserRef.current);

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    const canvasCtx = canvas.getContext('2d');

    const draw = () => {
      if (!canvasCtx || !analyserRef.current) return;

      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 64;
      const barWidth = (canvas.width / numBars) * 1.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < numBars; i++) {
        barHeight = dataArray[i] * 1.5;

        canvasCtx.fillStyle = `rgba(59, 130, 246, ${barHeight / 400})`;
        canvasCtx.beginPath();
        canvasCtx.roundRect(x, canvas.height / 2 - barHeight / 2, barWidth, barHeight, [50]);
        canvasCtx.fill();

        x += barWidth + 5;
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      source.disconnect();
    };
  }, [audioStream, isPlaying]);

  return <canvas ref={canvasRef} width="400" height="100" />;
};

export default SiriWaveform; 