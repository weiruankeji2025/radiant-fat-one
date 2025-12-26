-- 添加 weiruan 分类到 news_category 枚举
ALTER TYPE public.news_category ADD VALUE IF NOT EXISTS 'weiruan';

-- 创建访客统计表
CREATE TABLE public.visitor_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_active BOOLEAN DEFAULT true,
  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建唯一索引用于访客ID
CREATE UNIQUE INDEX idx_visitor_stats_visitor_id ON public.visitor_stats(visitor_id);

-- 创建索引用于查询活跃会话
CREATE INDEX idx_visitor_stats_active ON public.visitor_stats(session_active, last_active_at);

-- 启用 RLS
ALTER TABLE public.visitor_stats ENABLE ROW LEVEL SECURITY;

-- 允许所有人插入和更新访客记录（公开统计）
CREATE POLICY "Anyone can insert visitor stats"
ON public.visitor_stats
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update their own visitor stats"
ON public.visitor_stats
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can read visitor stats"
ON public.visitor_stats
FOR SELECT
USING (true);

-- 启用实时订阅
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_stats;