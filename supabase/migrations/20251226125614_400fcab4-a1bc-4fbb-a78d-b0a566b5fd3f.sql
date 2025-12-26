-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can submit friend link applications" ON public.friend_link_applications;

-- Create a permissive policy for public submissions
CREATE POLICY "Anyone can submit friend link applications" 
ON public.friend_link_applications 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);