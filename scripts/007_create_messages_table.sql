-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies

-- Users can view messages sent by them or sent to them
CREATE POLICY "Users can view their own messages" ON messages
FOR SELECT TO authenticated USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Users can insert messages where they are the sender
CREATE POLICY "Users can send messages" ON messages
FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id
);

-- Users can update messages sent to them (e.g. mark as read)
CREATE POLICY "Users can update received messages" ON messages
FOR UPDATE TO authenticated USING (
  auth.uid() = receiver_id
);
