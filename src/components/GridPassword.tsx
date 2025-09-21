import React from 'react';
import { GridData } from '../types';

interface GridPasswordProps {
  grid: GridData;
  onChange: (grid: GridData) => void;
  disabled?: boolean;
}

export const GridPassword: React.FC<GridPasswordProps> = ({ 
  grid, 
  onChange, 
  disabled = false 
}) => {
  const updateCell = (rowKey: keyof GridData, colIndex: number, value: string) => {
    const newGrid = { ...grid };
    newGrid[rowKey][colIndex] = value;
    onChange(newGrid);
  };

  const renderRow = (rowKey: keyof GridData, rowIndex: number) => {
    return (
      <div key={rowKey} className="flex gap-3">
        {grid[rowKey].map((cell, colIndex) => (
          <input
            key={`${rowIndex}-${colIndex}`}
            type="text"
            value={cell}
            onChange={(e) => updateCell(rowKey, colIndex, e.target.value)}
            disabled={disabled}
            className={`
              w-16 h-16 text-center border-2 rounded-lg font-mono text-sm
              transition-all duration-200 focus:outline-none
              ${disabled 
                ? 'bg-gray-100 border-gray-300 text-gray-500' 
                : 'bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }
            `}
            placeholder="?"
            maxLength={10}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 items-center">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        {disabled ? 'Enter Your Grid Password' : 'Create Your Grid Password'}
      </h3>
      <div className="flex flex-col gap-3 p-6 bg-white bg-opacity-50 rounded-xl border border-gray-200">
        {renderRow('row1', 0)}
        {renderRow('row2', 1)}
        {renderRow('row3', 2)}
      </div>
      {!disabled && (
        <p className="text-sm text-gray-600 text-center max-w-md">
          Enter any combination of numbers, letters, or symbols in the grid. 
          At least one cell must be filled. Remember this pattern - it's your password!
        </p>
      )}
    </div>
  );
};