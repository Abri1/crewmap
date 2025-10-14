-- Crew Map Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crews table
CREATE TABLE IF NOT EXISTS crews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID REFERENCES crews(id) ON DELETE CASCADE NOT NULL,
  nickname TEXT NOT NULL,
  truck_number TEXT,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE NOT NULL,
  crew_id UUID REFERENCES crews(id) ON DELETE CASCADE NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  speed DECIMAL(10, 2),
  heading DECIMAL(10, 2),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_drivers_crew_id ON drivers(crew_id);
CREATE INDEX IF NOT EXISTS idx_drivers_active ON drivers(crew_id, is_active);
CREATE INDEX IF NOT EXISTS idx_locations_crew_id ON locations(crew_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_locations_driver_id ON locations(driver_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_crews_code ON crews(code);

-- Enable Row Level Security
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow all authenticated and anonymous access
-- (Since we're not using auth, everyone can read/write)

-- Crews policies
CREATE POLICY "Allow all access to crews" ON crews
  FOR ALL USING (true) WITH CHECK (true);

-- Drivers policies
CREATE POLICY "Allow all access to drivers" ON drivers
  FOR ALL USING (true) WITH CHECK (true);

-- Locations policies
CREATE POLICY "Allow all access to locations" ON locations
  FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE crews;
ALTER PUBLICATION supabase_realtime ADD TABLE drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE locations;

-- Function to cleanup old location data (optional, run as cron job)
CREATE OR REPLACE FUNCTION cleanup_old_locations()
RETURNS void AS $$
BEGIN
  DELETE FROM locations
  WHERE timestamp < NOW() - INTERVAL '48 hours';
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired crews (optional, run as cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_crews()
RETURNS void AS $$
BEGIN
  DELETE FROM crews
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create indexes on timestamp for cleanup efficiency
CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON locations(timestamp);
CREATE INDEX IF NOT EXISTS idx_crews_expires_at ON crews(expires_at);
