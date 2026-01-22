-- Step 1: Add level_4 to user_level enum
ALTER TYPE public.user_level ADD VALUE IF NOT EXISTS 'level_4';