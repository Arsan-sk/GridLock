import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, UserPlus, Eye, EyeOff } from 'lucide-react';
import { AuthStep, RegistrationData, AuthMode } from '../types';
import { createEmptyGrid, createWhiteGrid, hasAtLeastOneFilledCell } from '../utils/gridUtils';
import { GridPassword } from './GridPassword';
import { GridPattern } from './GridPattern';
import { StepIndicator } from './StepIndicator';
import { Database } from '../services/database';

interface RegistrationFlowProps {
  onComplete: (data: RegistrationData) => void;
  onModeChange: (mode: AuthMode) => void;
}

export const RegistrationFlow: React.FC<RegistrationFlowProps> = ({ 
  onComplete, 
  onModeChange 
}) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>(1);
  const [passwordGridSize, setPasswordGridSize] = useState<number>(3);
  const [patternGridSize, setPatternGridSize] = useState<number>(3);
  const [showPasswordGrid, setShowPasswordGrid] = useState<boolean>(true); // true = visible
  const [showPatternGrid, setShowPatternGrid] = useState<boolean>(true);

  const [formData, setFormData] = useState<RegistrationData>({
    full_name: '',
    username: '',
    email: '',
    phone_number: '',
    grid_password: createEmptyGrid(3),
    grid_pattern: createWhiteGrid(3),
    password_grid_size: 3,
    pattern_grid_size: 3
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    // Basic phone validation (optional)
    if (formData.phone_number && !/^[\d+\-\s()]{6,20}$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Please enter a valid phone number';
    }

    // Async uniqueness checks
    if (!newErrors.username) {
      const userByUsername = await Database.getUserByIdentifier(formData.username);
      if (userByUsername) {
        newErrors.username = 'Username already exists — try another';
      }
    }

    if (!newErrors.email) {
      const userByEmail = await Database.getUserByIdentifier(formData.email);
      if (userByEmail) {
        newErrors.email = 'Email already registered — try signing in';
      }
    }
     
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    if (!hasAtLeastOneFilledCell(formData.grid_password)) {
      setErrors({ grid_password: 'At least one grid cell must be filled' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!hasAtLeastOneFilledCell(formData.grid_pattern)) {
      setErrors({ grid_pattern: 'At least one color must be different from white' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = async () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = await validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        if (isValid) {
          onComplete(formData);
          return;
        }
        break;
    }
    
    if (isValid && currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as AuthStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as AuthStep);
      setErrors({});
    }
  };

  const handlePasswordSizeChange = (n: number) => {
    const newGrid = createEmptyGrid(n);
    // copy existing values where possible
    for (let i = 0; i < Math.min(n, formData.grid_password.length); i++) {
      for (let j = 0; j < Math.min(n, formData.grid_password[i].length); j++) {
        newGrid[i][j] = formData.grid_password[i][j];
      }
    }
    setPasswordGridSize(n);
    setFormData({...formData, grid_password: newGrid, password_grid_size: n});
  };

  const handlePatternSizeChange = (n: number) => {
    const newGrid = createWhiteGrid(n);
    for (let i = 0; i < Math.min(n, formData.grid_pattern.length); i++) {
      for (let j = 0; j < Math.min(n, formData.grid_pattern[i].length); j++) {
        newGrid[i][j] = formData.grid_pattern[i][j];
      }
    }
    setPatternGridSize(n);
    setFormData({...formData, grid_pattern: newGrid, pattern_grid_size: n});
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Create Your Account</h2>
        <p className="text-gray-600 mt-2">Let's start with your basic information</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className={`
              w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all
              ${errors.full_name 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
              }
            `}
            placeholder="Enter your full name"
          />
          {errors.full_name && (
            <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className={`
              w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all
              ${errors.username 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
              }
            `}
            placeholder="Choose a username"
          />
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">{errors.username}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`
              w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all
              ${errors.email 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
              }
            `}
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone (optional)
          </label>
          <input
            type="tel"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            className={`
              w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all
              ${errors.phone_number 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
              }
            `}
            placeholder="Optional phone number"
          />
          {errors.phone_number && (
            <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>
          )}
        </div>
         
       </div>
     </div>
   );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Set Your Grid Password</h2>
        <p className="text-gray-600 mt-2">This unique grid will be part of your secure login</p>
      </div>

      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="flex items-center">
          <label className="mr-2 text-sm text-gray-600">Grid size:</label>
          <select
            value={passwordGridSize}
            onChange={(e) => handlePasswordSizeChange(Number(e.target.value))}
            className="border px-2 py-1 rounded"
          >
            {Array.from({ length: 8 }, (_, i) => i + 3).map((n) => (
              <option key={n} value={n}>{n} x {n}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          aria-pressed={showPasswordGrid}
          onClick={() => setShowPasswordGrid((s) => !s)}
          className="flex items-center gap-2 px-2 py-1 rounded border hover:bg-gray-50"
          title={showPasswordGrid ? 'Hide password grid content' : 'Show password grid content'}
        >
          {showPasswordGrid ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>
 
      <GridPassword
        grid={formData.grid_password}
        onChange={(grid) => setFormData({ ...formData, grid_password: grid })}
        masked={!showPasswordGrid}
      />
      
      {errors.grid_password && (
        <p className="text-red-500 text-sm text-center">{errors.grid_password}</p>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Create Your Color Pattern</h2>
        <p className="text-gray-600 mt-2">Choose colors to complete your secure authentication</p>
      </div>

      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="flex items-center">
          <label className="mr-2 text-sm text-gray-600">Pattern size:</label>
          <select
            value={patternGridSize}
            onChange={(e) => handlePatternSizeChange(Number(e.target.value))}
            className="border px-2 py-1 rounded"
          >
            {Array.from({ length: 8 }, (_, i) => i + 3).map((n) => (
              <option key={n} value={n}>{n} x {n}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          aria-pressed={showPatternGrid}
          onClick={() => setShowPatternGrid((s) => !s)}
          className="flex items-center gap-2 px-2 py-1 rounded border hover:bg-gray-50"
          title={showPatternGrid ? 'Hide pattern colors' : 'Show pattern colors'}
        >
          {showPatternGrid ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>
 
      <GridPattern
        grid={formData.grid_pattern}
        onChange={(grid) => setFormData({ ...formData, grid_pattern: grid })}
        hideColors={!showPatternGrid}
      />
      
      {errors.grid_pattern && (
        <p className="text-red-500 text-sm text-center">{errors.grid_pattern}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator currentStep={currentStep} totalSteps={3} mode="register" />
      
      <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl shadow-lg p-8 mb-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>
      
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
            ${currentStep === 1 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
            }
          `}
        >
          <ArrowLeft size={20} />
          Previous
        </button>
        
        <button
          onClick={() => onModeChange('login')}
          className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Already have an account? Sign In
        </button>
        
        <button
          onClick={handleNext}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-all"
        >
          {currentStep === 3 ? (
            <>
              <UserPlus size={20} />
              Create Account
            </>
          ) : (
            <>
              Next
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};