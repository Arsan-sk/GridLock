import { User, RegistrationData, Session } from '../types';
import { supabase } from '../supabaseClient';

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
        phone_number: data.phone_number ?? null,
        grid_password: data.grid_password,
        grid_pattern: data.grid_pattern,
        password_grid_size: data.password_grid_size,
        pattern_grid_size: data.pattern_grid_size,
      }])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create user: ${insertError.message}`);
    }

    return newUser as User;
  }


  // Insert new Session
  static async createUserSession(userId: string): Promise<Session> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Session valid for 1 hour

    try {
      const { data: newSession, error: insertError } = await supabase
        .from('sessions')
        .insert([{
          user_id: userId,
          expires_at: expiresAt.toISOString()
        }])
        .select()
        .single();

      if (insertError) {
        // If sessions table doesn't exist or insert fails, fall back below
        console.warn('createUserSession insert error:', insertError.message);
        throw insertError;
      }

      return newSession as Session;
    } catch (err) {
      // Graceful fallback when sessions table is missing or other DB errors occur.
      // Return a local fallback session object so registration/login flow continues.
      console.warn('Falling back to local session object due to error:', err);
      return {
        session_id: `local-${Date.now()}`,
        user_id: userId,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      } as Session;
    }
  }

  // Delete a Session Linked to a user_id or session id 
  static async deleteUserSession(identifier: string): Promise<void> {
    try {
      const { error: deleteError } = await supabase
        .from('sessions')
        .delete()
        .eq('user_id', identifier);

      if (deleteError) {
        console.warn('Failed to delete session:', deleteError.message);
      }
    } catch (err) {
      console.warn('deleteUserSession error (likely missing sessions table):', err);
    }
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
    if (!identifier) return null;

    // Try username lookup first
    try {
      const { data: byUsername, error: errU } = await supabase
        .from('users')
        .select('*')
        .eq('username', identifier)
        .limit(1);
      if (errU) throw errU;
      if (byUsername && byUsername.length > 0) return byUsername[0] as User;

      // Try email lookup
      const { data: byEmail, error: errE } = await supabase
        .from('users')
        .select('*')
        .eq('email', identifier)
        .limit(1);
      if (errE) throw errE;
      if (byEmail && byEmail.length > 0) return byEmail[0] as User;

      // If identifier looks like a UUID, try id lookup
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      if (isUUID) {
        const { data: byId, error: errId } = await supabase
          .from('users')
          .select('*')
          .eq('id', identifier)
          .limit(1);
        if (errId) throw errId;
        if (byId && byId.length > 0) return byId[0] as User;
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to fetch user: ${(error as Error).message}`);
    }
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
