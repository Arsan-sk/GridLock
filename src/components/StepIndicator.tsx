import React from 'react';
import { Check } from 'lucide-react';
import { AuthStep } from '../types';

interface StepIndicatorProps {
  currentStep: AuthStep;
  totalSteps: number;
  mode: 'register' | 'login';
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ 
  currentStep, 
  totalSteps, 
  mode 
}) => {
  const getStepLabel = (step: number): string => {
    if (mode === 'register') {
      switch (step) {
        case 1: return 'Basic Info';
        case 2: return 'Grid Password';
        case 3: return 'Color Pattern';
        default: return `Step ${step}`;
      }
    } else {
      switch (step) {
        case 1: return 'Identify';
        case 2: return 'Password';
        case 3: return 'Pattern';
        default: return `Step ${step}`;
      }
    }
  };

  return (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        
        return (
          <div key={step} className="flex items-center">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
              ${isCompleted 
                ? 'bg-green-500 border-green-500 text-white' 
                : isCurrent 
                  ? 'bg-blue-500 border-blue-500 text-white' 
                  : 'bg-white border-gray-300 text-gray-400'
              }
            `}>
              {isCompleted ? (
                <Check size={16} />
              ) : (
                <span className="font-semibold">{step}</span>
              )}
            </div>
            {step < totalSteps && (
              <div className={`
                w-16 h-1 mx-2 rounded transition-all duration-300
                ${step < currentStep ? 'bg-green-500' : 'bg-gray-300'}
              `} />
            )}
            {step <= totalSteps && (
              <div className="absolute mt-12 transform -translate-x-1/2">
                <span className={`
                  text-xs font-medium whitespace-nowrap
                  ${isCompleted || isCurrent ? 'text-gray-700' : 'text-gray-400'}
                `}>
                  {getStepLabel(step)}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};