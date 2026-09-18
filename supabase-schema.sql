-- ==============================================================================
-- ERROREN AI - Supabase Database Schema & Security Setup
-- ==============================================================================
-- Run this script in your Supabase Project's SQL Editor to set up the required
-- tables, Row-Level Security (RLS) policies, and automatic profile generation.
-- ==============================================================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'New chat',
  pinned BOOLEAN DEFAULT FALSE,
  project_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  attachment JSONB,
  generated_image JSONB,
  feedback TEXT CHECK (feedback IN ('like', 'dislike', NULL)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Indexes for High Performance
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);

-- ==============================================================================
-- Enable Row Level Security (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Conversations Policies
DROP POLICY IF EXISTS "Users can read own conversations" ON public.conversations;
CREATE POLICY "Users can read own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
CREATE POLICY "Users can insert own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
CREATE POLICY "Users can delete own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Messages Policies
DROP POLICY IF EXISTS "Users can read own messages" ON public.messages;
CREATE POLICY "Users can read own messages" ON public.messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
CREATE POLICY "Users can insert own messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages" ON public.messages
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- Automatic Profile Creation Trigger on Sign Up
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
