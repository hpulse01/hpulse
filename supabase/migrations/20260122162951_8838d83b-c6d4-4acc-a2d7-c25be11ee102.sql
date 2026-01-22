-- Update handle_new_user function to auto-assign level_2 for new registrations
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles (user_id, display_name, level, ai_uses_remaining)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
      'level_2',  -- Auto upgrade to level_2 on registration
      1           -- Give 1 AI interpretation use
    );
    RETURN NEW;
END;
$function$;