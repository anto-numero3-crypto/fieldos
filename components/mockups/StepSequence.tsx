'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';

interface Step {
  title: string;
  description: string;
  content: ReactNode;
}

interface StepSequenceProps {
  steps: Step[];
  intervalMs?: number;
  className?: string;
}

export default function StepSequence({ steps, intervalMs = 4000, className = '' }: StepSequenceProps) {
  const [activeStep, setActiveStep] = useState(0);

  const advance = useCallback(() => {
    setActiveStep((prev) => (prev + 1) % steps.length);
  }, [steps.length]);

  useEffect(() => {
    const timer = setInterval(advance, intervalMs);
    return () => clearInterval(timer);
  }, [advance, intervalMs]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Step indicators */}
      <div className="flex items-center justify-center">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center">
            {/* Circle */}
            <div className={`relative w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
              idx < activeStep
                ? 'bg-green-500 border-green-500'
                : idx === activeStep
                ? 'bg-indigo-600 border-indigo-600'
                : 'bg-white border-gray-300'
            }`}>
              {idx < activeStep ? (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className={`text-xs font-bold ${
                  idx === activeStep ? 'text-white' : 'text-gray-500'
                }`}>
                  {idx + 1}
                </span>
              )}
            </div>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-1 transition-all duration-500 ${
                idx < activeStep ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Labels */}
      <div className="text-center">
        <div className="text-sm font-semibold text-gray-900">{steps[activeStep].title}</div>
        <div className="text-xs text-gray-500 mt-0.5">{steps[activeStep].description}</div>
      </div>

      {/* Content area */}
      <div className="transition-all duration-500">
        {steps[activeStep].content}
      </div>
    </div>
  );
}
