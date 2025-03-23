import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session) => {
        setSession(session);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setUser(null);
        }
      }
    );

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      setUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  async function signUp(email: string, password: string, userData: any) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });
      
      if (error) throw error;
      
      // Create profile entry
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            first_name: userData.first_name,
            last_name: userData.last_name,
          });
        
        if (profileError) throw profileError;
      }
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  return {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    supabase,
  };
}

// Hook for easier data access
export function useSupabaseData<T>(tableName: string) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function fetchData(query?: any) {
    try {
      setLoading(true);
      let dataQuery = supabase.from(tableName).select('*');
      
      // Apply custom query if provided
      if (query) {
        dataQuery = query(dataQuery);
      }
      
      const { data, error } = await dataQuery;
      
      if (error) throw error;
      setData(data as T[]);
    } catch (err: any) {
      setError(err);
      console.error(`Error fetching data from ${tableName}:`, err);
    } finally {
      setLoading(false);
    }
  }

  async function insertRecord(record: Partial<T>) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .insert(record)
        .select();
      
      if (error) throw error;
      
      // Refresh data after insert
      fetchData();
      return data;
    } catch (err: any) {
      console.error(`Error inserting into ${tableName}:`, err);
      throw err;
    }
  }

  async function updateRecord(id: string, updates: Partial<T>) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      // Refresh data after update
      fetchData();
      return data;
    } catch (err: any) {
      console.error(`Error updating in ${tableName}:`, err);
      throw err;
    }
  }

  async function deleteRecord(id: string) {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh data after delete
      fetchData();
    } catch (err: any) {
      console.error(`Error deleting from ${tableName}:`, err);
      throw err;
    }
  }

  return {
    data,
    loading,
    error,
    fetchData,
    insertRecord,
    updateRecord,
    deleteRecord,
  };
} 