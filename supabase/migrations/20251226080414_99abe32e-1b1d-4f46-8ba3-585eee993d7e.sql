-- Fix 1: Add write protection to news_articles table (only service role can write)
CREATE POLICY "Deny all direct inserts" 
ON public.news_articles 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Deny all direct updates" 
ON public.news_articles 
FOR UPDATE 
USING (false);

CREATE POLICY "Deny all direct deletes" 
ON public.news_articles 
FOR DELETE 
USING (false);

-- Fix 2: Update profiles SELECT policy to require authentication
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);