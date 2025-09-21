export interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  grid_password: GridData;
  grid_pattern: GridData;
  created_at: string;
}

export interface GridData {
  row1: [string, string, string];
  row2: [string, string, string];
  row3: [string, string, string];
}

export interface RegistrationData {
  full_name: string;
  username: string;
  email: string;
  grid_password: GridData;
  grid_pattern: GridData;
}

export interface LoginData {
  identifier: string;
  grid_password: GridData;
  grid_pattern: GridData;
}

export type AuthStep = 1 | 2 | 3;
export type AuthMode = 'register' | 'login' | 'welcome';