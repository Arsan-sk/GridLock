import React, { useEffect, useRef, useState } from 'react';
import { getColorClass, getNextColor } from '../utils/gridUtils';

export const GridPattern: React.FC<{
  grid: string[][];
  onChange: (grid: string[][]) => void;
  disabled?: boolean;
  hideColors?: boolean;
}> = ({ grid, onChange, disabled = false, hideColors = false }) => {
  const size = grid?.length || 3;
  const cellSize = Math.max(36, Math.floor(240 / size)); // px

  // Track revealed cells while user interacts: keys like "r-c"
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const timersRef = useRef<Record<string, number>>({});

  const REVEAL_DURATION_MS = 1000; // changed from 5000 -> 2000

  const revealCell = (rowIndex: number, colIndex: number) => {
    const key = `${rowIndex}-${colIndex}`;

    // mark revealed for this cell only
    setRevealed((r) => ({ ...r, [key]: true }));

    // clear existing timer for this cell
    const prev = timersRef.current[key];
    if (prev) {
      clearTimeout(prev);
    }

    // set a new timer to hide after REVEAL_DURATION_MS
    const id = window.setTimeout(() => {
      setRevealed((r) => {
        const next = { ...r };
        delete next[key];
        return next;
      });
      delete timersRef.current[key];
    }, REVEAL_DURATION_MS);

    timersRef.current[key] = id as unknown as number;
  };

  const hideCellImmediately = (rowIndex: number, colIndex: number) => {
    const key = `${rowIndex}-${colIndex}`;
    const prev = timersRef.current[key];
    if (prev) {
      clearTimeout(prev);
      delete timersRef.current[key];
    }
    setRevealed((r) => {
      const next = { ...r };
      delete next[key];
      return next;
    });
  };

  const toggleColor = (rowIndex: number, colIndex: number) => {
    if (disabled) return;
    const currentColor = grid[rowIndex][colIndex];
    const nextColor = getNextColor(currentColor);
    const newGrid = grid.map((r) => [...r]);
    newGrid[rowIndex][colIndex] = nextColor;
    onChange(newGrid);

    // Reveal only the toggled cell for REVEAL_DURATION_MS
    revealCell(rowIndex, colIndex);
  };

  // If hideColors is turned off, clear timers and reset revealed state
  useEffect(() => {
    if (!hideColors) {
      Object.values(timersRef.current).forEach((id) => clearTimeout(id));
      timersRef.current = {};
      setRevealed({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideColors]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((id) => clearTimeout(id));
      timersRef.current = {};
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 items-center">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        {disabled ? 'Recreate Your Color Pattern' : 'Create Your Color Pattern'}
      </h3>
      <div className="flex flex-col gap-3 p-6 bg-white bg-opacity-50 rounded-xl border border-gray-200">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-3">
            {row.map((color, colIndex) => {
              const key = `${rowIndex}-${colIndex}`;

              // Decide what to display:
              // - if actual visibility is allowed (hideColors false) show actual color
              // - if hideColors true and this cell is revealed show actual color
              // - otherwise show black for any non-white color (white stays white)
              const displayColor =
                color === 'white'
                  ? 'white'
                  : !hideColors || revealed[key]
                    ? color
                    : 'black';

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleColor(rowIndex, colIndex)}
                  onFocus={() => revealCell(rowIndex, colIndex)}
                  /* removed onBlur that re-triggered reveal for previous cells */
                  disabled={disabled}
                  style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                  className={`
                    border-2 rounded-lg transition-all duration-200
                    ${getColorClass(displayColor)}
                    ${disabled
                      ? 'cursor-not-allowed opacity-70'
                      : 'hover:scale-105 active:scale-95 cursor-pointer hover:shadow-md'
                    }
                  `}
                  aria-label={`Grid cell ${rowIndex + 1}-${colIndex + 1}: ${displayColor}`}
                >
                  {displayColor === 'white' && (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      ?
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
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