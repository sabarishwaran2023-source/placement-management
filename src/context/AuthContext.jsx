import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);
const LOCAL_API_BASE = 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null); // 'student' | 'company' | 'admin'
  const [loading, setLoading] = useState(true);

  // Fetch the profile row from `profiles` table with local fallback
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) return data;

      // If profile is missing in Supabase profiles table, try creating default
      if (!data && userId) {
        const { data: userAuth } = await supabase.auth.getUser();
        const email = userAuth?.user?.email || '';
        const name = userAuth?.user?.user_metadata?.name || email.split('@')[0] || 'User';
        const defaultRole = userAuth?.user?.user_metadata?.role || 'student';

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email,
            name,
            role: defaultRole
          }, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (!createError && newProfile) return newProfile;
      }
    } catch (err) {
      console.warn('[AuthContext] fetchProfile network catch:', err.message);
    }

    // Fallback to local profile cache
    const stored = localStorage.getItem('local_auth_profile');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return null;
  }, []);

  // Called after every auth state change
  const handleSession = useCallback(async (currentSession) => {
    setSession(currentSession);
    if (currentSession?.user) {
      setUser(currentSession.user);
      const p = await fetchProfile(currentSession.user.id);
      setProfile(p);
      setRole(p?.role || currentSession.user.user_metadata?.role || 'student');
    } else {
      setUser(null);
      setProfile(null);
      setRole(null);
    }
    setLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    // 1. First check if we have a locally stored user session
    const storedUser = localStorage.getItem('local_auth_user');
    const storedProfile = localStorage.getItem('local_auth_profile');
    const storedToken = localStorage.getItem('token');

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const parsedProfile = storedProfile ? JSON.parse(storedProfile) : null;
        setUser(parsedUser);
        setProfile(parsedProfile);
        setRole(parsedProfile?.role || parsedUser?.user_metadata?.role || 'student');
        setSession({ access_token: storedToken || 'local_session_token', user: parsedUser });
        setLoading(false);
      } catch (e) {
        console.warn('Error reading local auth storage:', e);
      }
    }

    // 2. Also listen for Supabase auth if running
    let subscription = null;
    try {
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        if (s) {
          handleSession(s);
        } else if (!storedUser) {
          setLoading(false);
        }
      }).catch(() => {
        if (!storedUser) setLoading(false);
      });

      const { data } = supabase.auth.onAuthStateChange((_event, s) => {
        if (s) handleSession(s);
      });
      subscription = data?.subscription;
    } catch (err) {
      if (!storedUser) setLoading(false);
    }

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [handleSession]);

  // --- Auth Actions ---

  const signUp = async ({ email, password, name, role: userRole = 'student', extraData = {} }) => {
    let supabaseError = null;
    let data = null;

    try {
      const res = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: userRole,
            department:       extraData.department       || null,
            cgpa:             extraData.cgpa             || null,
            register_number:  extraData.register_number  || null,
            graduation_year:  extraData.graduation_year  || null,
            company_name:     extraData.company_name     || null,
            phone:            extraData.phone            || null,
          }
        }
      });
      data = res.data;
      if (res.error) supabaseError = res.error;
    } catch (err) {
      supabaseError = err;
    }

    // If Supabase failed (DNS failure / paused project / fetch failed), seamlessly fall back to local Express backend!
    if (supabaseError) {
      console.warn('[AuthContext] Supabase sign up unavailable, falling back to local Express backend:', supabaseError.message);
      
      const isNetworkOrFetchErr = 
        !supabaseError.message ||
        supabaseError.message.includes('fetch') ||
        supabaseError.message.includes('NetworkError') ||
        supabaseError.name === 'TypeError' ||
        supabaseError.status === 0;

      if (isNetworkOrFetchErr) {
        try {
          const localRes = await fetch(`${LOCAL_API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              email,
              password,
              role: userRole,
              department: extraData.department,
              cgpa: extraData.cgpa,
              companyName: extraData.company_name,
              registerNumber: extraData.register_number,
              graduationYear: extraData.graduation_year
            })
          });

          const localJson = await localRes.json();
          if (!localRes.ok) {
            throw new Error(localJson.message || 'Registration failed on local server');
          }

          const localUser = {
            id: String(localJson.user.id),
            email: localJson.user.email,
            user_metadata: { name: localJson.user.name, role: localJson.user.role }
          };

          const localProfile = {
            id: String(localJson.user.id),
            name: localJson.user.name,
            email: localJson.user.email,
            role: localJson.user.role,
            department: extraData.department || 'CSE',
            cgpa: extraData.cgpa || 8.0,
            register_number: extraData.register_number || '',
            graduation_year: extraData.graduation_year || new Date().getFullYear() + 1,
            company_name: extraData.company_name || '',
            studentId: localJson.user.studentId,
            companyId: localJson.user.companyId
          };

          localStorage.setItem('local_auth_user', JSON.stringify(localUser));
          localStorage.setItem('local_auth_profile', JSON.stringify(localProfile));
          localStorage.setItem('token', localJson.token);

          setUser(localUser);
          setProfile(localProfile);
          setRole(localJson.user.role);
          const newSession = { access_token: localJson.token, user: localUser };
          setSession(newSession);

          return { session: newSession, user: localUser };
        } catch (localErr) {
          throw new Error(localErr.message || 'Unable to connect to registration service.');
        }
      }

      throw supabaseError;
    }

    // Save full profile to Supabase DB immediately if Supabase succeeded
    if (data?.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          name,
          role: userRole,
          ...extraData
        }, { onConflict: 'id' });
      } catch (profileError) {
        console.warn('[AuthContext] profile upsert error:', profileError.message);
      }

      if (data.session) {
        await handleSession(data.session);
      }
    }
    return data;
  };

  const signIn = async ({ email, password }) => {
    let supabaseError = null;
    let data = null;

    try {
      const res = await supabase.auth.signInWithPassword({ email, password });
      data = res.data;
      if (res.error) supabaseError = res.error;
    } catch (err) {
      supabaseError = err;
    }

    // If Supabase failed, seamlessly fall back to local Express backend!
    if (supabaseError) {
      console.warn('[AuthContext] Supabase sign in unavailable, falling back to local Express backend:', supabaseError.message);

      const isNetworkOrFetchErr = 
        !supabaseError.message ||
        supabaseError.message.includes('fetch') ||
        supabaseError.message.includes('NetworkError') ||
        supabaseError.name === 'TypeError' ||
        supabaseError.status === 0;

      if (isNetworkOrFetchErr) {
        try {
          const localRes = await fetch(`${LOCAL_API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });

          const localJson = await localRes.json();
          if (!localRes.ok) {
            throw new Error(localJson.message || 'Invalid email or password');
          }

          const localUser = {
            id: String(localJson.user.id),
            email: localJson.user.email,
            user_metadata: { name: localJson.user.name, role: localJson.user.role }
          };

          const localProfile = {
            id: String(localJson.user.id),
            name: localJson.user.name,
            email: localJson.user.email,
            role: localJson.user.role,
            studentId: localJson.user.studentId,
            companyId: localJson.user.companyId
          };

          localStorage.setItem('local_auth_user', JSON.stringify(localUser));
          localStorage.setItem('local_auth_profile', JSON.stringify(localProfile));
          localStorage.setItem('token', localJson.token);

          setUser(localUser);
          setProfile(localProfile);
          setRole(localJson.user.role);
          const newSession = { access_token: localJson.token, user: localUser };
          setSession(newSession);

          return { session: newSession, user: localUser };
        } catch (localErr) {
          throw new Error(localErr.message || 'Unable to connect to local authentication server.');
        }
      }

      throw new Error(supabaseError.message || 'Invalid email or password');
    }

    return data;
  };

  const signOut = async () => {
    localStorage.removeItem('local_auth_user');
    localStorage.removeItem('local_auth_profile');
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
    setRole(null);
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
    } catch (err) {
      console.warn('Reset password error:', err.message);
      // In offline / local mode, show simulated success
      return true;
    }
  };

  const resendConfirmation = async (email) => {
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
    } catch (err) {
      console.warn('Resend confirmation error:', err.message);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error('Not authenticated');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'id' })
        .select()
        .maybeSingle();
      if (!error && data) {
        setProfile(data);
        return data;
      }
    } catch (e) {}

    // Fallback locally
    const current = profile || {};
    const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem('local_auth_profile', JSON.stringify(updated));
    setProfile(updated);
    return updated;
  };

  const refreshProfile = async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    if (p) {
      setProfile(p);
      setRole(p?.role || role);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        resendConfirmation,
        updateProfile,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
