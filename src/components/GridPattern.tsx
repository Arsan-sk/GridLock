import React from 'react';
import { GridData } from '../types';
import { getColorClass, getNextColor } from '../utils/gridUtils';

interface GridPatternProps {
  grid: GridData;
  onChange: (grid: GridData) => void;
  disabled?: boolean;
}

export const GridPattern: React.FC<GridPatternProps> = ({ 
  grid, 
  onChange, 
  disabled = false 
}) => {
  const toggleColor = (rowKey: keyof GridData, colIndex: number) => {
    if (disabled) return;
    
    const currentColor = grid[rowKey][colIndex];
    const nextColor = getNextColor(currentColor);
    const newGrid = { ...grid };
    newGrid[rowKey][colIndex] = nextColor;
    onChange(newGrid);
  };

  const renderRow = (rowKey: keyof GridData, rowIndex: number) => {
    return (
      <div key={rowKey} className="flex gap-3">
        {grid[rowKey].map((color, colIndex) => (
          <button
            key={`${rowIndex}-${colIndex}`}
            type="button"
            onClick={() => toggleColor(rowKey, colIndex)}
            disabled={disabled}
            className={`
              w-16 h-16 border-2 rounded-lg transition-all duration-200
              ${getColorClass(color)}
              ${disabled 
                ? 'cursor-not-allowed opacity-70' 
                : 'hover:scale-105 active:scale-95 cursor-pointer hover:shadow-md'
              }
            `}
            aria-label={`Grid cell ${rowIndex + 1}-${colIndex + 1}: ${color}`}
          >
            {color === 'white' && (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                ?
              </div>
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 items-center">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        {disabled ? 'Recreate Your Color Pattern' : 'Create Your Color Pattern'}
      </h3>
      <div className="flex flex-col gap-3 p-6 bg-white bg-opacity-50 rounded-xl border border-gray-200">
        {renderRow('row1', 0)}
        {renderRow('row2', 1)}
        {renderRow('row3', 2)}
      </div>
      {!disabled && (
        <p className="text-sm text-gray-600 text-center max-w-md">
          Click each cell to cycle through colors: white → blue → green → red → yellow → purple. 
          Create a unique pattern you'll remember!
        </p>
      )}
    </div>
  );
};