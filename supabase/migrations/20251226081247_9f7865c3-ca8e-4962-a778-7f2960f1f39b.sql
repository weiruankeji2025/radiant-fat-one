-- Create news_views table for browsing history
CREATE TABLE public.news_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id)
);

-- Enable RLS
ALTER TABLE public.news_views ENABLE ROW LEVEL SECURITY;

-- Users can view their own history
CREATE POLICY "Users can view their own history" 
ON public.news_views 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own views
CREATE POLICY "Users can insert their own views" 
ON public.news_views 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own views
CREATE POLICY "Users can delete their own history" 
ON public.news_views 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create news_favorites table
CREATE TABLE public.news_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id)
);

-- Enable RLS
ALTER TABLE public.news_favorites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view their own favorites" 
ON public.news_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert their own favorites" 
ON public.news_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites" 
ON public.news_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_news_views_user_id ON public.news_views(user_id);
CREATE INDEX idx_news_views_article_id ON public.news_views(article_id);
CREATE INDEX idx_news_favorites_user_id ON public.news_favorites(user_id);
CREATE INDEX idx_news_favorites_article_id ON public.news_favorites(article_id);