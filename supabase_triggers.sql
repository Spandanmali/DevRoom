-- Create a table for public profiles if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  avatar_url  TEXT DEFAULT '',
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: We link id to auth.users(id) so that the user ID exactly matches the Supabase Auth ID.

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile"
ON public.users FOR SELECT
USING ( auth.uid() = id );

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
USING ( auth.uid() = id );

-- Allow insertion during trigger (bypasses RLS since it runs with securely elevated privileges as postgres role)

-- Create the trigger function to automatically insert a new row into public.users
-- whenever a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

-- Attach the trigger to the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Interview Sessions Table
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id           TEXT REFERENCES public.rooms(id) ON DELETE CASCADE,
  host_id           UUID REFERENCES public.users(id),
  problem_statement TEXT NOT NULL,
  duration_minutes  INT NOT NULL DEFAULT 45,
  final_code        TEXT DEFAULT '',
  ai_evaluation     TEXT DEFAULT '',
  status            TEXT DEFAULT 'active',
  started_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at          TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interview sessions for rooms they are in"
ON public.interview_sessions FOR SELECT
TO authenticated
USING ( true );

CREATE POLICY "Hosts can create interview sessions"
ON public.interview_sessions FOR INSERT
TO authenticated
WITH CHECK ( auth.uid() = host_id );

CREATE POLICY "Hosts can update their interview sessions"
ON public.interview_sessions FOR UPDATE
TO authenticated
USING ( auth.uid() = host_id );
