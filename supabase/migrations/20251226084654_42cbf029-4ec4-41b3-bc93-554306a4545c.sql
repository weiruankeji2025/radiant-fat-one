-- 添加 cnmd 分类到 news_category 枚举
ALTER TYPE public.news_category ADD VALUE IF NOT EXISTS 'cnmd';