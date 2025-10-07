export interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  phone_number?: string;                 // new optional phone field
  grid_password: string[][];               // dynamic n x n
  grid_pattern: string[][];                // dynamic m x m
  password_grid_size: number;              // n
  pattern_grid_size: number;               // m
  created_at: string;
}

export interface GridData {
  // Now dynamic; represented by string[][]
}

export interface RegistrationData {
  full_name: string;
  username: string;
  email: string;
  phone_number?: string;                  // new optional phone field
  grid_password: string[][];               // dynamic
  grid_pattern: string[][];                // dynamic
  password_grid_size: number;              // n
  pattern_grid_size: number;               // m
}

export interface LoginData {
  identifier: string;
  grid_password: string[][];
  grid_pattern: string[][];
}

export interface Session {
  session_id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
}

export type AuthStep = 1 | 2 | 3;
export type AuthMode = 'register' | 'login' | 'welcome';