import { GridData } from '../types';

export const createEmptyGrid = (): GridData => ({
  row1: ['', '', ''],
  row2: ['', '', ''],
  row3: ['', '', '']
});

export const createWhiteGrid = (): GridData => ({
  row1: ['white', 'white', 'white'],
  row2: ['white', 'white', 'white'],
  row3: ['white', 'white', 'white']
});

export const isGridEmpty = (grid: GridData): boolean => {
  return Object.values(grid).every(row => 
    row.every(cell => cell === '' || cell === 'white')
  );
};

export const hasAtLeastOneFilledCell = (grid: GridData): boolean => {
  return Object.values(grid).some(row => 
    row.some(cell => cell !== '' && cell !== 'white')
  );
};

export const compareGrids = (grid1: GridData, grid2: GridData): boolean => {
  const rows1 = Object.values(grid1);
  const rows2 = Object.values(grid2);
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (rows1[i][j] !== rows2[i][j]) {
        return false;
      }
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
    blue: 'bg-blue-500 border-blue-600',
    green: 'bg-green-500 border-green-600',
    red: 'bg-red-500 border-red-600',
    yellow: 'bg-yellow-500 border-yellow-600',
    purple: 'bg-purple-500 border-purple-600'
  };
  return colorMap[color] || colorMap.white;
};