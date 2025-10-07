import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, LogIn, Eye, EyeOff } from 'lucide-react';
import { AuthStep, LoginData, AuthMode, User } from '../types';
import { createEmptyGrid, createWhiteGrid, compareGrids } from '../utils/gridUtils';
import { GridPassword } from './GridPassword';
import { GridPattern } from './GridPattern';
import { StepIndicator } from './StepIndicator';

interface LoginFlowProps {
  users: User[];
  onComplete: (user: User) => void;
  onModeChange: (mode: AuthMode) => void;
}

export const LoginFlow: React.FC<LoginFlowProps> = ({ 
  users, 
  onComplete, 
  onModeChange 
}) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>(1);
  const [formData, setFormData] = useState<LoginData>({
    identifier: '',
    grid_password: createEmptyGrid(3),
    grid_pattern: createWhiteGrid(3)
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showPasswordGrid, setShowPasswordGrid] = useState<boolean>(true);
  const [showPatternGrid, setShowPatternGrid] = useState<boolean>(true);

  const validateStep1 = (): boolean => {
    if (!formData.identifier.trim()) {
      setErrors({ identifier: 'Username or email is required' });
      return false;
    }
    
    const user = users.find(u => 
      u.username === formData.identifier || u.email === formData.identifier
    );
    
    if (!user) {
      setErrors({ identifier: 'User not found' });
      return false;
    }
    
    // Initialize grids to user's sizes
    const pwSize = user.password_grid_size || (user.grid_password?.length || 3);
    const patSize = user.pattern_grid_size || (user.grid_pattern?.length || 3);
    setFormData({
      identifier: formData.identifier,
      grid_password: createEmptyGrid(pwSize),
      grid_pattern: createWhiteGrid(patSize)
    });

    setCurrentUser(user);
    setErrors({});
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!currentUser) return false;
    
    if (!compareGrids(formData.grid_password, currentUser.grid_password)) {
      setErrors({ grid_password: 'Grid password does not match' });
      return false;
    }
    
    setErrors({});
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!currentUser) return false;
    
    if (!compareGrids(formData.grid_pattern, currentUser.grid_pattern)) {
      setErrors({ grid_pattern: 'Color pattern does not match' });
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleNext = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        if (isValid && currentUser) {
          onComplete(currentUser);
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
      
      if (currentStep === 2) {
        setCurrentUser(null);
        setFormData({
          ...formData,
          grid_password: createEmptyGrid(),
          grid_pattern: createWhiteGrid()
        });
      }
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
        <p className="text-gray-600 mt-2">Enter your username or email to continue</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Username or Email
        </label>
        <input
          type="text"
          value={formData.identifier}
          onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
          className={`
            w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all
            ${errors.identifier 
              ? 'border-red-500 focus:ring-red-200' 
              : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
            }
          `}
          placeholder="Enter username or email"
        />
        {errors.identifier && (
          <p className="text-red-500 text-sm mt-1">{errors.identifier}</p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800">Enter Your Grid Password</h2>
          <button
            type="button"
            aria-pressed={showPasswordGrid}
            onClick={() => setShowPasswordGrid((s) => !s)}
            className="ml-2 p-1 rounded border hover:bg-gray-50"
            title={showPasswordGrid ? 'Hide password grid content' : 'Show password grid content'}
          >
            {showPasswordGrid ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
        <p className="text-gray-600 mt-2">
          Welcome back, <span className="font-medium">{currentUser?.full_name}</span>
        </p>
      </div>
      
      <GridPassword
        grid={formData.grid_password}
        onChange={(grid) => setFormData({ ...formData, grid_password: grid })}
        disabled={false}
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
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800">Recreate Your Color Pattern</h2>
          <button
            type="button"
            aria-pressed={showPatternGrid}
            onClick={() => setShowPatternGrid((s) => !s)}
            className="ml-2 p-1 rounded border hover:bg-gray-50"
            title={showPatternGrid ? 'Hide pattern colors' : 'Show pattern colors'}
          >
            {showPatternGrid ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
        <p className="text-gray-600 mt-2">Final step to complete your secure login</p>
      </div>
      
      <GridPattern
        grid={formData.grid_pattern}
        onChange={(grid) => setFormData({ ...formData, grid_pattern: grid })}
        disabled={false}
        hideColors={!showPatternGrid}
      />
      
      {errors.grid_pattern && (
        <p className="text-red-500 text-sm text-center">{errors.grid_pattern}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator currentStep={currentStep} totalSteps={3} mode="login" />
      
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
          onClick={() => onModeChange('register')}
          className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Need an account? Sign Up
        </button>
        
        <button
          onClick={handleNext}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-all"
        >
          {currentStep === 3 ? (
            <>
              <LogIn size={20} />
              Sign In
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