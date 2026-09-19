-- Run once in the Supabase SQL editor before using the AI page.
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mass_id uuid REFERENCES mass_services(id) ON DELETE CASCADE,
  readings_summary text,
  prompt text,
  result jsonb,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);
