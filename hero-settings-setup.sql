-- Create hero_settings table for admin-configurable hero section content
CREATE TABLE IF NOT EXISTS hero_settings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL DEFAULT 'Surigao City',
  subtitle VARCHAR(255) NOT NULL DEFAULT 'BBQ Stalls',
  description TEXT NOT NULL DEFAULT 'Experience the authentic taste of slow-smoked BBQ perfection. Every bite tells a story of tradition, passion, and fire.',
  badge_text VARCHAR(255) NOT NULL DEFAULT '#1 BBQ Restaurant in Surigao',
  button_text VARCHAR(255) NOT NULL DEFAULT 'ORDER NOW',
  button_link VARCHAR(255) NOT NULL DEFAULT '/cart',
  show_badge BOOLEAN NOT NULL DEFAULT true,
  show_features BOOLEAN NOT NULL DEFAULT true,
  show_trust_indicators BOOLEAN NOT NULL DEFAULT true,
  image_1_url TEXT,
  image_2_url TEXT,
  image_3_url TEXT,
  feature_1_text VARCHAR(255) NOT NULL DEFAULT '2+ Hours Advance Order',
  feature_2_text VARCHAR(255) NOT NULL DEFAULT '4 Convenient Locations',
  feature_3_text VARCHAR(255) NOT NULL DEFAULT 'Premium Quality',
  trust_item_1_number VARCHAR(50) NOT NULL DEFAULT '15+',
  trust_item_1_label VARCHAR(255) NOT NULL DEFAULT 'Menu Items',
  trust_item_2_number VARCHAR(50) NOT NULL DEFAULT '4',
  trust_item_2_label VARCHAR(255) NOT NULL DEFAULT 'Branch Locations',
  trust_item_3_number VARCHAR(50) NOT NULL DEFAULT '100%',
  trust_item_3_label VARCHAR(255) NOT NULL DEFAULT 'Fresh & Local',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default hero settings
INSERT INTO hero_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_hero_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hero_settings_updated_at
  BEFORE UPDATE ON hero_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_hero_settings_updated_at();
