-- Ensure streak_data table has correct structure
CREATE TABLE IF NOT EXISTS streak_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  flashcard_current_streak INTEGER NOT NULL DEFAULT 0,
  flashcard_all_time_high INTEGER NOT NULL DEFAULT 0,
  last_flashcard_date DATE,
  question_of_day_streak INTEGER NOT NULL DEFAULT 0,
  question_of_day_best_streak INTEGER NOT NULL DEFAULT 0,
  last_qod_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_streak_data_updated_at
    BEFORE UPDATE ON streak_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE streak_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own streak data"
ON streak_data FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak data"
ON streak_data FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak data"
ON streak_data FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);