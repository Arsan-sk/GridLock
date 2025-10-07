import { GridData } from '../types';

export const createEmptyGrid = (n = 3): string[][] => {
  return Array.from({ length: n }, () => Array.from({ length: n }, () => ''));
};

export const createWhiteGrid = (n = 3): string[][] => {
  return Array.from({ length: n }, () => Array.from({ length: n }, () => 'white'));
};

export const isGridEmpty = (grid: string[][]): boolean => {
  return grid.every(row => row.every(cell => cell === '' || cell === 'white'));
};

export const hasAtLeastOneFilledCell = (grid: string[][]): boolean => {
  return grid.some(row => row.some(cell => cell !== '' && cell !== 'white'));
};

export const compareGrids = (grid1: string[][], grid2: string[][]): boolean => {
  if (!grid1 || !grid2) return false;
  if (grid1.length !== grid2.length) return false;
  for (let i = 0; i < grid1.length; i++) {
    for (let j = 0; j < grid1[i].length; j++) {
      if (grid1[i][j] !== grid2[i]?.[j]) return false;
    }
  }
  return true;
};

export const getColorOptions = (): string[] => [
  'white', 'blue', 'green', 'red', 'yellow', 'purple'
];

export const getNextColor = (currentColor: string): string => {
  const colors = getColorOptions();
  const currentIndex = colors.indexOf(currentColor);
  return colors[(currentIndex + 1) % colors.length];
};

export const getColorClass = (color: string): string => {
  const colorMap: Record<string, string> = {
    white: 'bg-white border-gray-300',
    black: 'bg-black border-black',
    blue: 'bg-blue-500 border-blue-600',
    green: 'bg-green-500 border-green-600',
    red: 'bg-red-500 border-red-600',
    yellow: 'bg-yellow-500 border-yellow-600',
    purple: 'bg-purple-500 border-purple-600'
  };
  return colorMap[color] || colorMap.white;
};