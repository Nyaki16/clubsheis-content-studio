'use client';

import { useState, useEffect } from 'react';

const messages = [
  'Reading your brief...',
  'Channelling the brand voice...',
  'Building your content...',
  'Crafting the perfect hook...',
  'Polishing every sentence...',
  'Almost ready...',
];

export default function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + Math.random() * 8, 90));
    }, 500);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="py-20 text-center">
      <h2 className="font-display text-3xl tracking-wide mb-8">
        {messages[messageIndex]}
      </h2>

      <div className="max-w-md mx-auto">
        <div className="h-1 bg-grey-light overflow-hidden">
          <div
            className="h-full bg-yellow transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="font-ui text-xs text-grey-mid mt-6">
        This usually takes 10–20 seconds
      </p>
    </div>
  );
}
