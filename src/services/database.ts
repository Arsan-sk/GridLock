import { createClient } from '@supabase/supabase-js';
import { User, RegistrationData } from '../types';

// Get Supabase credentials from environment variables
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseUrl = 'https://eabihggmizkwkkfbdxvq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhYmloZ2dtaXprd2trZmJkeHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NjgwMjAsImV4cCI6MjA3MjA0NDAyMH0.MmxSDWitcBxgX_hZAHL40lGv36EOzXUe2fv_vbJyhMs';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class Database {
  static async createUser(data: RegistrationData): Promise<User> {
    // Check if username or email already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('username, email')
      .or(`username.eq.${data.username},email.eq.${data.email}`);

    if (checkError) {
      throw new Error(`Database error: ${checkError.message}`);
    }

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.username === data.username) {
        throw new Error('Username already exists');
      }
      if (existingUser.email === data.email) {
        throw new Error('Email already exists');
      }
    }

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        full_name: data.full_name,
        username: data.username,
        email: data.email,
        grid_password: data.grid_password,
        grid_pattern: data.grid_pattern
      }])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create user: ${insertError.message}`);
    }

    return newUser as User;
  }

  static async getUsers(): Promise<User[]> {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return users as User[];
  }

  static async getUserByIdentifier(identifier: string): Promise<User | null> {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${identifier},email.eq.${identifier}`)
      .limit(1);

    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return users && users.length > 0 ? users[0] as User : null;
  }

  static async clearUsers(): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all users

    if (error) {
      console.warn('Failed to initialize demo data:', error);
    }
  }

  // Initialize with demo data if table is empty
  static async initializeDemoData(): Promise<void> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (error) {
        console.warn('Could not check for existing users:', error.message);
        return;
      }

      // If no users exist, the demo user will be created by the migration
      if (!users || users.length === 0) {
        console .log('No users found - demo data should be created by migration');
      }
    } catch (err) {
      console.error('Error initializing demo data:', err);
    }
  }
}
