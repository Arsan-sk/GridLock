/*
  # Create users table for grid authentication system

  1. New Tables
    - `users`
      - `id` (uuid, primary key, auto-generated)
      - `full_name` (text, required)
      - `username` (text, unique, required)
      - `email` (text, unique, required)
      - `phone_number` (text, nullable)
      - `grid_password` (jsonb, stores 3x3 grid password data)
      - `grid_pattern` (jsonb, stores 3x3 color pattern data)
      - `created_at` (timestamp, auto-generated)

  2. Security
    - Enable RLS on `users` table
    - Add policy for public read access (for login verification)
    - Add policy for public insert access (for registration)

  3. Sample Data
    - Insert demo user for testing
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  phone_number text,                        -- new optional phone number
  grid_password jsonb NOT NULL,             -- stores array of arrays (password grid)
  grid_pattern jsonb NOT NULL,              -- stores array of arrays (color pattern)
  password_grid_size int NOT NULL DEFAULT 3,
  pattern_grid_size int NOT NULL DEFAULT 3,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (needed for registration and login)
CREATE POLICY "Allow public read access"
  ON users
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Insert demo user
INSERT INTO users (
  id,
  full_name,
  username,
  email,
  phone_number,
  grid_password,
  grid_pattern,
  password_grid_size,
  pattern_grid_size,
  created_at
) VALUES (
  'd1cbe02b-73c6-49b9-8241-32e8cd8a1e90',
  'John Doe',
  'john123',
  'john@example.com',
  '+10000000000',
  '[["", "12", ""], ["", "ab", ""], ["", "", ""]]'::jsonb,
  '[["white", "blue", "white"], ["green", "red", "white"], ["white", "white", "blue"]]'::jsonb,
  3,
  3,
  '2025-01-21T12:34:56Z'
) ON CONFLICT (id) DO NOTHING;