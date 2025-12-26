-- Add new category values to the news_category enum
ALTER TYPE news_category ADD VALUE IF NOT EXISTS 'china_us';
ALTER TYPE news_category ADD VALUE IF NOT EXISTS 'russia_ukraine';
ALTER TYPE news_category ADD VALUE IF NOT EXISTS 'korea';
ALTER TYPE news_category ADD VALUE IF NOT EXISTS 'southeast_asia';