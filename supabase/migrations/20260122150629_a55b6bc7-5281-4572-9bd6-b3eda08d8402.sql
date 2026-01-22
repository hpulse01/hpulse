-- 创建用户等级枚举
CREATE TYPE public.user_level AS ENUM ('level_1', 'level_2', 'level_3');

-- 创建用户资料表
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    level user_level NOT NULL DEFAULT 'level_1',
    ai_uses_remaining INTEGER NOT NULL DEFAULT 0,
    total_calculations INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建用户等级表 (用于角色管理)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_level NOT NULL DEFAULT 'level_1',
    UNIQUE (user_id, role)
);

-- 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的资料
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- 用户可以更新自己的资料 (但不能修改等级)
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 用户可以创建自己的资料
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 用户等级表RLS策略
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- 创建获取用户等级的安全函数
CREATE OR REPLACE FUNCTION public.get_user_level(p_user_id UUID)
RETURNS user_level
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT level FROM public.profiles WHERE user_id = p_user_id),
    'level_1'::user_level
  );
$$;

-- 创建检查AI使用权限的函数
CREATE OR REPLACE FUNCTION public.can_use_ai(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN (SELECT level FROM public.profiles WHERE user_id = p_user_id) = 'level_3' THEN true
    WHEN (SELECT level FROM public.profiles WHERE user_id = p_user_id) = 'level_2' 
         AND (SELECT ai_uses_remaining FROM public.profiles WHERE user_id = p_user_id) > 0 THEN true
    ELSE false
  END;
$$;

-- 创建消耗AI使用次数的函数
CREATE OR REPLACE FUNCTION public.consume_ai_use(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_level user_level;
  v_remaining INTEGER;
BEGIN
  SELECT level, ai_uses_remaining INTO v_level, v_remaining
  FROM public.profiles WHERE user_id = p_user_id;
  
  IF v_level = 'level_3' THEN
    RETURN true;
  ELSIF v_level = 'level_2' AND v_remaining > 0 THEN
    UPDATE public.profiles 
    SET ai_uses_remaining = ai_uses_remaining - 1,
        updated_at = now()
    WHERE user_id = p_user_id;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- 创建自动更新时间戳的触发器
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 创建用户注册后自动创建profile的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name, level, ai_uses_remaining)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
      'level_1',
      0
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 创建触发器
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();