// React hooks for Supabase operations
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';

/**
 * Hook for authentication
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const signIn = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return { user, loading, error, signUp, signIn, signOut };
}

/**
 * Hook for fetching data from Supabase with RLS
 */
export function useSupabaseQuery(table, filters = {}, enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase.from(table).select('*');

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query;
      if (error) throw error;

      setData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [table, filters, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * Hook for subscribing to real-time changes
 */
export function useSupabaseRealtime(table, callback) {
  useEffect(() => {
    const subscription = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        callback(payload);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [table, callback]);
}

/**
 * Hook for inserting data
 */
export function useSupabaseInsert(table) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const insert = useCallback(
    async (data) => {
      try {
        setLoading(true);
        const { data: result, error: err } = await supabase
          .from(table)
          .insert([data])
          .select();

        if (err) throw err;
        setError(null);
        return result[0];
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [table]
  );

  return { insert, loading, error };
}

/**
 * Hook for updating data
 */
export function useSupabaseUpdate(table) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = useCallback(
    async (id, data) => {
      try {
        setLoading(true);
        const { data: result, error: err } = await supabase
          .from(table)
          .update(data)
          .eq('id', id)
          .select();

        if (err) throw err;
        setError(null);
        return result[0];
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [table]
  );

  return { update, loading, error };
}

/**
 * Hook for deleting data
 */
export function useSupabaseDelete(table) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const delete_ = useCallback(
    async (id) => {
      try {
        setLoading(true);
        const { error: err } = await supabase
          .from(table)
          .delete()
          .eq('id', id);

        if (err) throw err;
        setError(null);
        return true;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [table]
  );

  return { delete: delete_, loading, error };
}

/**
 * Hook for file storage
 */
export function useSupabaseStorage(bucket) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const upload = useCallback(
    async (path, file) => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase.storage
          .from(bucket)
          .upload(path, file);

        if (err) throw err;
        setError(null);
        return data;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [bucket]
  );

  const getPublicUrl = useCallback(
    (path) => {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    },
    [bucket]
  );

  const getSignedUrl = useCallback(
    async (path, expiresIn = 3600) => {
      try {
        const { data, error: err } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, expiresIn);

        if (err) throw err;
        return data.signedUrl;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [bucket]
  );

  return { upload, getPublicUrl, getSignedUrl, loading, error };
}
