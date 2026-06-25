-- 1. Optimization for Messages table retrieval (messages list ordered by date desc per group chat)
CREATE INDEX IF NOT EXISTS idx_messages_group_id_created_at ON messages(group_id, created_at DESC);

-- 2. Optimization for Group Members check inside loadConvos and queries
CREATE INDEX IF NOT EXISTS idx_group_members_group_user ON group_members(group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- 3. Optimization for Active Signals Feed filtered by campus and expiration
CREATE INDEX IF NOT EXISTS idx_signals_expires_intent ON signals(expires_at, intent);
CREATE INDEX IF NOT EXISTS idx_signals_user_id ON signals(user_id);

-- 4. Optimization for Social Follow relations (followers/following stats and checks)
CREATE INDEX IF NOT EXISTS idx_follows_relations ON follows(follower_id, following_id, status);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id, status);

-- 5. Optimization for Marketplace Listings queries per college
CREATE INDEX IF NOT EXISTS idx_listings_college_active ON listings(college, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);

-- 6. Optimization for Money expense / split statistics per user
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_splits_user_id ON splits(user_id, date DESC);
