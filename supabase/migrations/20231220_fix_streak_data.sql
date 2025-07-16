-- Ensure streak_data table has correct structure
CREATE TABLE IF NOT EXISTS streak_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  flashcard_current_streak INTEGER NOT NULL DEFAULT 0,
  flashcard_streak INTEGER NOT NULL DEFAULT 0,
  best_flashcard_streak INTEGER NOT NULL DEFAULT 0,
  flashcard_all_time_high INTEGER NOT NULL DEFAULT 0,
  last_flashcard_date DATE,
  question_of_day_streak INTEGER NOT NULL DEFAULT 0,
  question_of_day_best_streak INTEGER NOT NULL DEFAULT 0,
  last_qod_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add updated_at trigger if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_streak_data_updated_at ON streak_data;
CREATE TRIGGER update_streak_data_updated_at
  BEFORE UPDATE ON streak_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure RLS is properly configured
ALTER TABLE streak_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read their own streak data" ON streak_data;
DROP POLICY IF EXISTS "Users can insert their own streak data" ON streak_data;
DROP POLICY IF EXISTS "Users can update their own streak data" ON streak_data;

-- Create fresh policies with correct permissions
CREATE POLICY "Users can read their own streak data"
  ON streak_data
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak data"
  ON streak_data
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak data"
  ON streak_data
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_streak_data_user_id ON streak_data(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_data_last_flashcard_date ON streak_data(last_flashcard_date);