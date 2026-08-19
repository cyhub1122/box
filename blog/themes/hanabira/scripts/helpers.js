'use strict';

// 去除 HTML 标签，得到纯文本
function stripHtml(content) {
  return String(content || '')
    .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<code[^>]*>[\s\S]*?<\/code>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

const CJK_RE = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g;

// 字数统计：中日韩字符按字计，拉丁按词计
function wordCount(content) {
  const text = stripHtml(content).replace(/\s+/g, '');
  const cjk = (text.match(CJK_RE) || []).length;
  const latin = text.replace(CJK_RE, ' ').trim();
  const words = latin ? latin.split(/\s+/).length : 0;
  return cjk + words;
}

// 阅读时长（分钟）
function readingTime(content) {
  const text = stripHtml(content).replace(/\s+/g, '');
  const cjk = (text.match(CJK_RE) || []).length;
  const words = wordCount(content) - cjk;
  const minutes = Math.ceil(cjk / 400 + words / 200);
  return Math.max(1, minutes);
}

// 文章摘要
function postExcerpt(post) {
  if (post.excerpt) return post.excerpt;
  const text = stripHtml(post.content).replace(/\s+/g, ' ').trim();
  return text.length > 160 ? text.slice(0, 160) + '…' : text;
}

// 归档按年份分组
function postsByYear(posts) {
  const list = Array.isArray(posts)
    ? posts
    : (posts && typeof posts.toArray === 'function' ? posts.toArray() : []);
  const map = {};
  list.forEach((post) => {
    const y = post.date.year();
    if (!map[y]) map[y] = [];
    map[y].push(post);
  });
  return Object.keys(map).sort((a, b) => b - a).map((y) => ({ year: y, posts: map[y] }));
}

// 站点运行天数（默认按站点配置 since 计算）
function runningDays(sinceStr) {
  if (!sinceStr) return 0;
  const start = new Date(sinceStr);
  if (isNaN(start.getTime())) return 0;
  const now = new Date();
  const days = Math.floor((now - start) / 86400000);
  return Math.max(0, days);
}

// 站点总字数
function totalWords(posts) {
  const list = Array.isArray(posts)
    ? posts
    : (posts && typeof posts.toArray === 'function' ? posts.toArray() : []);
  return list.reduce((sum, p) => sum + wordCount(p.content), 0);
}

hexo.extend.helper.register('stripHtml', stripHtml);
hexo.extend.helper.register('wordCount', wordCount);
hexo.extend.helper.register('readingTime', readingTime);
hexo.extend.helper.register('postExcerpt', postExcerpt);
hexo.extend.helper.register('postsByYear', postsByYear);
hexo.extend.helper.register('runningDays', runningDays);
hexo.extend.helper.register('totalWords', totalWords);