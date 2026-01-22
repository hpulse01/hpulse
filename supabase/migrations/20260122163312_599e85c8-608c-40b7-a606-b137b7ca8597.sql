-- Create table to track registration IPs
CREATE TABLE public.registration_ips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address text NOT NULL,
    registered_at timestamp with time zone NOT NULL DEFAULT now(),
    user_agent text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for fast IP lookups
CREATE INDEX idx_registration_ips_ip_address ON public.registration_ips (ip_address);
CREATE INDEX idx_registration_ips_registered_at ON public.registration_ips (registered_at);

-- Enable RLS
ALTER TABLE public.registration_ips ENABLE ROW LEVEL SECURITY;

-- Only allow insert via edge function (service role)
-- No public access to this table
CREATE POLICY "No public access"
ON public.registration_ips
FOR ALL
USING (false);

-- Function to clean up old records (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_registration_ips()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    DELETE FROM public.registration_ips 
    WHERE registered_at < now() - interval '24 hours';
$$;