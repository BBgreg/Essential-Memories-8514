-- Ensure the dates table exists with proper structure for automatic memory saving
CREATE TABLE IF NOT EXISTS dates_esm1234567 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 31),
  category TEXT NOT NULL CHECK (category IN ('Birthday', 'Anniversary', 'Special', 'Holiday')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Ensure streak data table exists
CREATE TABLE IF NOT EXISTS streak_data_esm1234567 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qotd_current_streak INTEGER DEFAULT 0 NOT NULL,
  qotd_all_time_high INTEGER DEFAULT 0 NOT NULL,
  last_qod_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Ensure practice sessions table exists
CREATE TABLE IF NOT EXISTS practice_sessions_esm1234567 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_id UUID NOT NULL REFERENCES dates_esm1234567(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('flashcard', 'qotd')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Ensure profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security on all tables
ALTER TABLE dates_esm1234567 ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_data_esm1234567 ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions_esm1234567 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read their own memories" ON dates_esm1234567;
DROP POLICY IF EXISTS "Users can insert their own memories" ON dates_esm1234567;
DROP POLICY IF EXISTS "Users can update their own memories" ON dates_esm1234567;
DROP POLICY IF EXISTS "Users can delete their own memories" ON dates_esm1234567;

-- Create RLS policies for dates_esm1234567
CREATE POLICY "Users can read their own memories" ON dates_esm1234567
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memories" ON dates_esm1234567
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories" ON dates_esm1234567
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" ON dates_esm1234567
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Drop existing policies for other tables
DROP POLICY IF EXISTS "Users can read their own streak data" ON streak_data_esm1234567;
DROP POLICY IF EXISTS "Users can insert their own streak data" ON streak_data_esm1234567;
DROP POLICY IF EXISTS "Users can update their own streak data" ON streak_data_esm1234567;

-- Create RLS policies for streak_data_esm1234567
CREATE POLICY "Users can read their own streak data" ON streak_data_esm1234567
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak data" ON streak_data_esm1234567
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak data" ON streak_data_esm1234567
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Drop existing policies for practice sessions
DROP POLICY IF EXISTS "Users can read their own practice sessions" ON practice_sessions_esm1234567;
DROP POLICY IF EXISTS "Users can insert their own practice sessions" ON practice_sessions_esm1234567;

-- Create RLS policies for practice_sessions_esm1234567
CREATE POLICY "Users can read their own practice sessions" ON practice_sessions_esm1234567
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice sessions" ON practice_sessions_esm1234567
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Drop existing policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can create own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_streak_data_updated_at ON streak_data_esm1234567;
CREATE TRIGGER update_streak_data_updated_at
  BEFORE UPDATE ON streak_data_esm1234567
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dates_user_id ON dates_esm1234567(user_id);
CREATE INDEX IF NOT EXISTS idx_dates_user_month_day ON dates_esm1234567(user_id, month, day);
CREATE INDEX IF NOT EXISTS idx_dates_category ON dates_esm1234567(category);
CREATE INDEX IF NOT EXISTS idx_dates_created_at ON dates_esm1234567(created_at);

CREATE INDEX IF NOT EXISTS idx_streak_data_user_id ON streak_data_esm1234567(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_data_last_qod_date ON streak_data_esm1234567(last_qod_date);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions_esm1234567(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_memory_id ON practice_sessions_esm1234567(memory_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_session_type ON practice_sessions_esm1234567(session_type);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON dates_esm1234567 TO authenticated;
GRANT ALL ON streak_data_esm1234567 TO authenticated;
GRANT ALL ON practice_sessions_esm1234567 TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Grant sequence permissions for auto-generated IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;