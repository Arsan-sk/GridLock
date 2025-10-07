import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { User } from '../types';
import { getColorClass, getNextColor } from '../utils/gridUtils';

/*
  PasswordReveal — updated:
  - Single global show/hide icon beside the Verify heading
  - No per-field eye icons or placeholders in verification inputs
  - Centered stored grids; show/hide icon centered beside the "Your stored grids" title
  - Navigation and Close buttons grouped at the right
  - Color interaction still temporarily reveals a cell for REVEAL_MS when masked
*/

export const PasswordReveal: React.FC<{
  user: User;
  onClose: () => void;
}> = ({ user, onClose }) => {
  const REVEAL_MS = 2000;

  // Fixed "top-left" verification target
  const vr = 0;
  const vc = 0;

  const storedInput = (user.grid_password?.[vr]?.[vc]) ?? '';
  const storedColor = (user.grid_pattern?.[vr]?.[vc]) ?? 'white';

  // user-provided verification values
  const [inputValue, setInputValue] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>(storedColor || 'white');

  // Global visibility toggle: true = show, false = hide
  const [showAll, setShowAll] = useState<boolean>(false);

  // When hidden (showAll === false), color interactions still reveal briefly
  const [revealColor, setRevealColor] = useState<boolean>(false);
  const revealTimerRef = useRef<number | null>(null);

  // For temporary text reveal on focus when hidden
  const [tempRevealInput, setTempRevealInput] = useState<boolean>(false);
  const inputTimerRef = useRef<number | null>(null);

  const [error, setError] = useState<string>('');
  const [verified, setVerified] = useState<boolean>(false);
  const [viewIndex, setViewIndex] = useState<number>(0); // 0 = inputs, 1 = colors

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
      if (inputTimerRef.current) {
        clearTimeout(inputTimerRef.current);
        inputTimerRef.current = null;
      }
    };
  }, []);

  const cycleColor = () => {
    setSelectedColor((c) => {
      const next = getNextColor(c || 'white');
      triggerColorReveal();
      return next;
    });
  };

  const triggerColorReveal = () => {
    if (showAll) return; // already visible
    setRevealColor(true);
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    revealTimerRef.current = window.setTimeout(() => {
      setRevealColor(false);
      revealTimerRef.current = null;
    }, REVEAL_MS) as unknown as number;
  };

  const handleInputFocus = () => {
    if (showAll) return;
    setTempRevealInput(true);
    if (inputTimerRef.current) clearTimeout(inputTimerRef.current);
    inputTimerRef.current = window.setTimeout(() => {
      setTempRevealInput(false);
      inputTimerRef.current = null;
    }, REVEAL_MS) as unknown as number;
  };

  const verify = () => {
    setError('');
    const inputMatches = (storedInput === '' && inputValue === ' ') || (storedInput === inputValue);
    const colorMatches = (storedColor === (selectedColor || 'white'));

    if (inputMatches && colorMatches) {
      setVerified(true);
      setError('');
    } else {
      setError('Invalid verification values. Please check and try again.');
      setVerified(false);
    }
  };

  // Display helpers (centered)
  const DisplayInputGrid: React.FC<{ mask: boolean }> = ({ mask }) => {
    const grid = user.grid_password || [];
    const n = Math.max(1, grid.length);
    const cellSize = Math.max(40, Math.floor(320 / n));
    return (
      <div className="flex justify-center">
        <div className="inline-block p-4 bg-white rounded border border-gray-200">
          {grid.map((row, r) => (
            <div key={r} className="flex gap-3 mb-3">
              {row.map((val, c) => (
                <div
                  key={`${r}-${c}`}
                  style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                  className="flex items-center justify-center border-2 rounded-lg bg-white text-sm font-mono"
                >
                  {mask ? (val ? '•'.repeat(Math.max(1, Math.min(10, val.length))) : '') : (val ?? '')}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const DisplayColorGrid: React.FC<{ mask: boolean }> = ({ mask }) => {
    const grid = user.grid_pattern || [];
    const n = Math.max(1, grid.length);
    const cellSize = Math.max(40, Math.floor(320 / n));
    return (
      <div className="flex justify-center">
        <div className="inline-block p-4 bg-white rounded border border-gray-200">
          {grid.map((row, r) => (
            <div key={r} className="flex gap-3 mb-3">
              {row.map((col, c) => {
                const color = col || 'white';
                const displayColor = mask && color !== 'white' ? 'black' : color;
                return (
                  <div
                    key={`${r}-${c}`}
                    style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                    className={`${getColorClass(displayColor)} border-2 rounded-lg`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // touch swipe for mobile
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => (touchStartX.current = e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) setViewIndex((v) => Math.min(1, v + 1));
      else setViewIndex((v) => Math.max(0, v - 1));
    }
    touchStartX.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-6 relative">
        {/* Header: verify title + global show/hide icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1"></div>

          <div className="flex-1 text-center flex items-center justify-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800">Verify to show your stored grids</h2>
            <button
              className="p-2 rounded border hover:bg-gray-50"
              onClick={() => {
                // Toggle: Eye = show, EyeOff = hide mapping per request
                const newShow = !showAll;
                setShowAll(newShow);
                if (!newShow) {
                  // turning off visibility clears temporary reveals
                  setTempRevealInput(false);
                  setRevealColor(false);
                }
              }}
              aria-label="Toggle show/hide"
              title=""
            >
              {showAll ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex-1 flex justify-end gap-2">
            {/* navigation + close (grouped on right) */}
            <button onClick={() => setViewIndex((v) => Math.max(0, v - 1))} className="p-2 rounded border hover:bg-gray-50"><ArrowLeft size={16} /></button>
            <button onClick={() => setViewIndex((v) => Math.min(1, v + 1))} className="p-2 rounded border hover:bg-gray-50"><ArrowRight size={16} /></button>
            <button onClick={onClose} className="p-2 rounded border hover:bg-gray-50"><X size={16} /></button>
          </div>
        </div>

        {!verified ? (
          <>git commit -m
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Text verification (no placeholder) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Top-left input cell</label>
                <div className="flex items-center gap-2">
                  <input
                    type={tempRevealInput || showAll ? 'text' : 'password'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={handleInputFocus}
                    className="w-full px-3 py-2 border rounded"
                    aria-label="Top-left input verification"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  If the stored cell is empty, enter a single space: " " (without quotes).
                </p>
              </div>

              {/* Color verification (no per-field eye) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Top-left color cell</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={cycleColor}
                    onMouseDown={triggerColorReveal}
                    className={`w-14 h-10 border rounded ${getColorClass((!showAll && !revealColor) ? 'black' : (selectedColor || 'white'))}`}
                    aria-label="Cycle color"
                  />
                  <div className="px-2 py-1 text-sm text-gray-700 rounded bg-gray-50 border">
                    {( !showAll && !revealColor) ? 'Hidden' : `${selectedColor}`}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  If the stored color is empty, select white.
                </p>
              </div>
            </div>

            {error && <div className="mt-4 text-red-600 font-medium">{error}</div>}

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 rounded border hover:bg-gray-50">Cancel</button>
              <button onClick={verify} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Verify</button>
            </div>
          </>
        ) : (
          <>
            {/* After verification: centered title with show/hide icon centered, controls on right */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1"></div>

              <div className="flex-1 text-center flex items-center justify-center gap-3">
                <h2 className="text-xl font-semibold text-gray-800">Your stored grids</h2>
                <button
                  className="p-2 rounded border hover:bg-gray-50"
                  onClick={() => {
                    const newShow = !showAll;
                    setShowAll(newShow);
                    if (!newShow) {
                      setTempRevealInput(false);
                      setRevealColor(false);
                    }
                  }}
                  aria-label="Toggle show/hide"
                  title=""
                >
                  {showAll ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex-1 flex justify-end gap-2">
                <button onClick={() => setViewIndex((v) => Math.max(0, v - 1))} className="p-2 rounded border hover:bg-gray-50"><ArrowLeft size={16} /></button>
                <button onClick={() => setViewIndex((v) => Math.min(1, v + 1))} className="p-2 rounded border hover:bg-gray-50"><ArrowRight size={16} /></button>
                <button onClick={onClose} className="p-2 rounded border hover:bg-gray-50"><X size={16} /></button>
              </div>
            </div>

            <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="overflow-hidden">
              <div className="flex transition-transform" style={{ width: '200%', transform: `translateX(-${viewIndex * 50}%)` }}>
                <div className="w-1/2 px-2 flex justify-center">
                  <div className="text-center">
                    <h3 className="text-sm text-gray-600 mb-2">Input Grid</h3>
                    <DisplayInputGrid mask={!showAll} />
                  </div>
                </div>
                <div className="w-1/2 px-2 flex justify-center">
                  <div className="text-center">
                    <h3 className="text-sm text-gray-600 mb-2">Color Grid</h3>
                    <DisplayColorGrid mask={!showAll} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={onClose} className="px-4 py-2 rounded border hover:bg-gray-50">Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
