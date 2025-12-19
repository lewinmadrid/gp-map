import { useCallback } from 'react';

interface ActivityData {
  [key: string]: any;
}

/**
 * Stub activity logger hook for npm package.
 * Consumers should provide their own logging via the onActivityLog prop.
 */
export const useActivityLogger = () => {
  const logActivity = useCallback(async (actionType: string, actionData?: ActivityData) => {
    // No-op by default - consumers should provide onActivityLog prop
    console.debug('[MapView Activity]', actionType, actionData);
  }, []);

  return { logActivity };
};

/**
 * Stub session functions - consumers should implement their own session tracking
 */
export const createSession = async () => {
  console.debug('[MapView] createSession called - implement your own session tracking');
  return null;
};

export const endSession = async () => {
  console.debug('[MapView] endSession called - implement your own session tracking');
};
