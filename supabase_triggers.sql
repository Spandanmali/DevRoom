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
