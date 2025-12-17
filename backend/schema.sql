-- CRM Escort AI - Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS (app owners)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CONNECTED ACCOUNTS (calendar, sms providers)
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'google_calendar', 'outlook', 'twilio', 'rm_chat', etc.
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_integrations_user_provider ON integrations(user_id, provider);

-- CONTACTS
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT,
    phone_number TEXT,
    email TEXT,
    organization TEXT,
    tags TEXT[] DEFAULT '{}',
    importance_score NUMERIC DEFAULT 0, -- AI-calculated importance
    last_interaction_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, phone_number)
);

CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_phone ON contacts(phone_number);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);

-- LOCATIONS (homes, hotels, Airbnbs, offices, meetup spots)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    label TEXT, -- "My condo", "Downtown Hyatt", "Airbnb - Midtown"
    type TEXT CHECK (type IN ('home', 'office', 'hotel', 'airbnb', 'other')),
    address_line TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'US',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    source TEXT DEFAULT 'user_profile', -- 'user_profile', 'calendar', 'ai_guess'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_locations_user_id ON locations(user_id);
CREATE INDEX idx_locations_city_state ON locations(city, state);

-- CONTACT <-> LOCATION LINKS
CREATE TABLE contact_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    role TEXT, -- 'their_home', 'their_hotel', 'usual_meetup', etc.
    confidence NUMERIC DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contact_locations_contact ON contact_locations(contact_id);

-- MESSAGES
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('sms', 'rm_chat', 'email', 'manual', 'whatsapp')),
    external_id TEXT, -- id from Twilio, RM, or other provider
    body TEXT NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ai_processed BOOLEAN DEFAULT FALSE,
    ai_result JSONB, -- store extraction result
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_contact_id ON messages(contact_id);
CREATE INDEX idx_messages_received_at ON messages(received_at DESC);
CREATE INDEX idx_messages_ai_processed ON messages(ai_processed) WHERE ai_processed = FALSE;
CREATE INDEX idx_messages_channel ON messages(channel);

-- EVENTS (meetings, shoots, calls)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    location TEXT, -- free-text location from message
    status TEXT CHECK (status IN ('confirmed', 'tentative', 'cancelled')) DEFAULT 'confirmed',
    source_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    external_calendar_id TEXT, -- Google/Outlook event ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_contact_id ON events(contact_id);
CREATE INDEX idx_events_start_time ON events(start_time);

-- TASKS (follow-ups, reminders)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_time TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('open', 'done', 'cancelled')) DEFAULT 'open',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    source_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status) WHERE status = 'open';
CREATE INDEX idx_tasks_due_time ON tasks(due_time);

-- MESSAGE TEMPLATES
CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    body TEXT NOT NULL, -- "Hey {contact_name}, confirming {date_time} at {location}."
    trigger TEXT, -- 'on_meeting_created', 'before_meeting', 'manual', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_templates_user_trigger ON message_templates(user_id, trigger);

-- WORKFLOWS (automation rules)
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL, -- 'on_message', 'on_event_created', 'before_event'
    condition_json JSONB NOT NULL DEFAULT '{}', -- rules (keywords, tags, etc.)
    actions_json JSONB NOT NULL DEFAULT '[]', -- list of actions
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_workflows_user_enabled ON workflows(user_id, enabled) WHERE enabled = TRUE;
CREATE INDEX idx_workflows_trigger ON workflows(trigger_type);

-- INTERACTION THREADS (grouped conversations)
CREATE TABLE interaction_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    first_message_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_message_at TIMESTAMP WITH TIME ZONE NOT NULL,
    message_count INTEGER DEFAULT 0,
    ai_summary TEXT, -- AI-generated conversation summary
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_threads_contact ON interaction_threads(contact_id);
CREATE INDEX idx_threads_last_message ON interaction_threads(last_message_at DESC);

-- AUDIT LOG (for compliance and debugging)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'message_sent', 'event_created', 'workflow_triggered', etc.
    entity_type TEXT, -- 'message', 'event', 'contact', etc.
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON interaction_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
