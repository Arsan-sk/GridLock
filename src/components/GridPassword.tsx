import React from 'react';
import { GridData } from '../types';

// Updated to support dynamic array grids and masked inputs
export const GridPassword: React.FC<{
  grid: string[][];
  onChange: (grid: string[][]) => void;
  disabled?: boolean;
  masked?: boolean;
}> = ({ grid, onChange, disabled = false, masked = false }) => {
  const n = grid?.length || 3;
  const cellSize = Math.max(36, Math.floor(240 / n));

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newGrid = grid.map((r) => [...r]);
    newGrid[rowIndex][colIndex] = value;
    onChange(newGrid);
  };

  return (
    <div className="flex flex-col gap-3 items-center">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        {disabled ? 'Enter Your Grid Password' : 'Create Your Grid Password'}
      </h3>
      <div className="flex flex-col gap-3 p-6 bg-white bg-opacity-50 rounded-xl border border-gray-200">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-3">
            {row.map((cell, colIndex) => (
              <input
                key={`${rowIndex}-${colIndex}`}
                type={masked ? 'password' : 'text'}
                value={cell}
                onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                disabled={disabled}
                style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                className={`
                  text-center border-2 rounded-lg font-mono text-sm
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
        ))}
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