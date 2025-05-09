
-- Create timeslots table for the schedule functionality
CREATE TABLE IF NOT EXISTS public.timeSlots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  total_slots INTEGER NOT NULL DEFAULT 0,
  slots_used INTEGER NOT NULL DEFAULT 0,
  volunteers TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_timeslots_date ON public.timeSlots (date);
CREATE INDEX IF NOT EXISTS idx_timeslots_times ON public.timeSlots (date, start_time, end_time);

-- Enable RLS
ALTER TABLE public.timeSlots ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Anyone can read timeslots"
  ON public.timeSlots
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Authenticated users can insert timeslots"
  ON public.timeSlots
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update timeslots"
  ON public.timeSlots
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete timeslots"
  ON public.timeSlots
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create settings table for user preferences
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Anyone can read settings"
  ON public.settings
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert settings
CREATE POLICY "Authenticated users can insert settings"
  ON public.settings
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update settings
CREATE POLICY "Authenticated users can update settings"
  ON public.settings
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Insert default slot limit setting
INSERT INTO public.settings (id, value)
VALUES ('slotLimit', '{"value": 2}')
ON CONFLICT (id) DO NOTHING;
