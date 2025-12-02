-- First, create missing profiles for users who don't have them
INSERT INTO public.profiles (id, email, created_at)
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Drop the existing foreign key constraint on user_sessions if it exists
ALTER TABLE public.user_sessions 
DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;

-- Recreate the foreign key constraint with ON DELETE CASCADE
-- Link to auth.users instead of profiles since that's the authoritative source
ALTER TABLE public.user_sessions
ADD CONSTRAINT user_sessions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;