-- Create friend_links table
CREATE TABLE public.friend_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.friend_links ENABLE ROW LEVEL SECURITY;

-- Anyone can view active friend links
CREATE POLICY "Anyone can view active friend links"
ON public.friend_links
FOR SELECT
USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can insert friend links"
ON public.friend_links
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update friend links"
ON public.friend_links
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete friend links"
ON public.friend_links
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can view all links (including inactive)
CREATE POLICY "Admins can view all friend links"
ON public.friend_links
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_friend_links_updated_at
BEFORE UPDATE ON public.friend_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();