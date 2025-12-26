-- 创建新闻分类枚举
CREATE TYPE news_category AS ENUM ('politics', 'military', 'technology', 'economy', 'world', 'other');

-- 创建新闻文章表
CREATE TABLE public.news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  source_url TEXT NOT NULL UNIQUE,
  source_name TEXT NOT NULL,
  category news_category NOT NULL DEFAULT 'other',
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- 创建公开读取策略（不需要登录即可浏览新闻）
CREATE POLICY "Anyone can view news articles"
ON public.news_articles
FOR SELECT
USING (true);

-- 创建索引以提高查询性能
CREATE INDEX idx_news_articles_category ON public.news_articles(category);
CREATE INDEX idx_news_articles_published_at ON public.news_articles(published_at DESC);
CREATE INDEX idx_news_articles_fetched_at ON public.news_articles(fetched_at DESC);

-- 启用 realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.news_articles;