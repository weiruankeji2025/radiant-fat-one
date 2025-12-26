-- Add page views tracking table
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add location data to visitor_stats
ALTER TABLE public.visitor_stats 
ADD COLUMN country TEXT,
ADD COLUMN city TEXT,
ADD COLUMN region TEXT,
ADD COLUMN device_type TEXT,
ADD COLUMN browser TEXT;

-- Enable RLS on page_views
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for page_views
CREATE POLICY "Anyone can insert page views" 
ON public.page_views 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read page views count" 
ON public.page_views 
FOR SELECT 
USING (true);

-- Enable realtime for page_views
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_views;