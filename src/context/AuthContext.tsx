import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  signUp: (email: string, password: string, fullName: string, phone: string, address: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  updateProfile: (data: {full_name?: string; phone?: string; address?: string}) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up auth state listener FIRST to prevent missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Invalidate product queries on auth state change to ensure fresh data
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['featured-products'] });
        }
        
        // Safely handle profile fetching without blocking auth flow
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else if (!session) {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    const checkSession = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        
        if (existingSession?.user) {
          setTimeout(() => {
            fetchProfile(existingSession.user.id);
          }, 0);
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string, address: string) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone: phone,
            address: address
          }
        }
      });

      if (error) throw error;

      toast.success("Account created successfully! Please check your email to verify your account.");
      
      // Return a flag to indicate successful signup for redirect handling
      return { success: true };
    } catch (error: any) {
      toast.error(error.message || "An error occurred during sign up");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success("Signed in successfully!");
      navigate("/shop");
    } catch (error: any) {
      toast.error(error.message || "An error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "An error occurred during Google sign in");
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "An error occurred during sign out");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: {full_name?: string; phone?: string; address?: string}) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user?.id);

      if (error) throw error;
      
      // Refresh profile after update
      if (user) {
        await fetchProfile(user.id);
      }
      
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "An error occurred while updating your profile");
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    profile,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    loading,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
