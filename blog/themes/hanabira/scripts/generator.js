'use strict';

// 生成站内搜索数据文件 search.json
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
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ');
}

hexo.extend.generator.register('search_data', function (locals) {
  const posts = locals.posts.sort('-date').map(function (post) {
    return {
      title: post.title,
      path: post.path,
      date: post.date.format('YYYY-MM-DD'),
      categories: post.categories.map(function (c) { return c.name; }),
      tags: post.tags.map(function (t) { return t.name; }),
      excerpt: post.excerpt ? stripHtml(post.excerpt) : stripHtml(post.content).slice(0, 140),
      content: stripHtml(post.content),
    };
  });
  return { path: 'search.json', data: JSON.stringify(posts) };
});