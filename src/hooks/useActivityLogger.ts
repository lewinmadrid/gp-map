import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityData {
  [key: string]: any;
}

export const useActivityLogger = () => {
  const logActivity = useCallback(async (actionType: string, actionData?: ActivityData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('Cannot log activity: No authenticated user');
        return;
      }

      const { error } = await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action_type: actionType,
          action_data: actionData || {}
        });

      if (error) {
        console.error('Error logging activity:', error);
      }
    } catch (error) {
      console.error('Error in logActivity:', error);
    }
  }, []);

  return { logActivity };
};

export const createSession = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const userAgent = navigator.userAgent;
    
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        user_agent: userAgent
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    // Store session ID in localStorage for logout tracking
    if (data) {
      localStorage.setItem('current_session_id', data.id);
    }

    return data;
  } catch (error) {
    console.error('Error in createSession:', error);
    return null;
  }
};

export const endSession = async () => {
  try {
    const sessionId = localStorage.getItem('current_session_id');
    
    if (!sessionId) return;

    // Get session start time to calculate duration
    const { data: session } = await supabase
      .from('user_sessions')
      .select('login_at')
      .eq('id', sessionId)
      .single();

    if (!session) return;

    const loginAt = new Date(session.login_at);
    const logoutAt = new Date();
    const durationMinutes = Math.round((logoutAt.getTime() - loginAt.getTime()) / (1000 * 60));

    const { error } = await supabase
      .from('user_sessions')
      .update({
        logout_at: logoutAt.toISOString(),
        duration_minutes: durationMinutes
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error ending session:', error);
    }

    // Clear session ID from localStorage
    localStorage.removeItem('current_session_id');
  } catch (error) {
    console.error('Error in endSession:', error);
  }
};