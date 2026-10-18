(function () {
  'use strict';

  var language = function () {
    return document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl' ? 'ar' : 'en';
  };
  var copy = {
    en: {
      eyebrow: 'Latest articles',
      title: 'Ideas to support your next step',
      description: 'Explore recent Arabic articles from Fedniy on careers, learning, and work.',
      all: 'All topics',
      empty: 'Articles are temporarily unavailable. Please check back soon.',
      loadMore: 'Load more',
      read: 'Read on Fedniy',
      related: 'Related reading',
      categories: 'Filter articles by topic'
    },
    ar: {
      eyebrow: 'أحدث المقالات',
      title: 'أفكار تدعم خطوتك القادمة',
      description: 'اكتشف أحدث مقالات فدني العربية حول المسارات المهنية والتعلّم والعمل.',
      all: 'كل الموضوعات',
      empty: 'المقالات غير متاحة مؤقتًا. يُرجى العودة قريبًا.',
      loadMore: 'تحميل المزيد',
      read: 'اقرأ على فدني',
      related: 'مقالات ذات صلة',
      categories: 'تصفية المقالات حسب الموضوع'
    }
  };

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function safeArticle(article) {
    if (!article || typeof article !== 'object' || typeof article.title !== 'string') return false;
    try {
      var url = new URL(article.url);
      return url.protocol === 'https:' && (url.hostname === 'fedniy.com' || url.hostname === 'www.fedniy.com');
    } catch (_) {
      return false;
    }
  }

  function formatDate(value, locale) {
    var date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function card(article, locale) {
    var image = '';
    if (typeof article.image === 'string' && /^https:\/\//i.test(article.image)) {
      image = '<img src="' + escapeHtml(article.image) + '" alt="' + escapeHtml(article.imageAlt || article.title) + '" loading="lazy" decoding="async">';
    }
    var categories = Array.isArray(article.categories) ? article.categories.filter(Boolean).slice(0, 1) : [];
    return '<article class="article-card">' +
      '<div class="article-card-media">' + image + '</div>' +
      '<div class="article-card-content">' +
      (categories.length ? '<span class="article-category">' + escapeHtml(categories[0]) + '</span>' : '') +
      '<h3>' + escapeHtml(article.title) + '</h3>' +
      (formatDate(article.date, locale) ? '<time datetime="' + escapeHtml(article.date) + '">' + escapeHtml(formatDate(article.date, locale)) + '</time>' : '') +
      (article.excerpt ? '<p>' + escapeHtml(article.excerpt) + '</p>' : '') +
      '<a class="article-read-link" href="' + escapeHtml(article.url) + '" target="_blank" rel="noopener">' + copy[locale].read + '<span aria-hidden="true"> ↗</span></a>' +
      '</div></article>';
  }

  function render(root, articles, options) {
    var locale;
    var labels;
    var grid = root.querySelector('[data-article-grid]');
    var status = root.querySelector('[data-article-status]');
    var filters = root.querySelector('[data-article-filters]');
    var loadMore = root.querySelector('[data-article-load-more]');
    var count = options.limit || articles.length;
    var selected = '';

    function display() {
      var filtered = selected ? articles.filter(function (article) {
        return Array.isArray(article.categories) && article.categories.includes(selected);
      }) : articles;
      var visible = filtered.slice(0, count);
      grid.innerHTML = visible.map(function (article) { return card(article, locale); }).join('');
      status.hidden = filtered.length > 0;
      if (loadMore) loadMore.hidden = filtered.length <= count || options.loadMore === false;
      if (filters) {
        filters.querySelectorAll('[data-category]').forEach(function (button) {
          button.setAttribute('aria-pressed', String(button.dataset.category === selected));
        });
      }
    }

    var categories = Array.from(new Set(articles.reduce(function (all, article) {
      return all.concat(Array.isArray(article.categories) ? article.categories : []);
    }, []))).filter(Boolean);

    function updateLanguage() {
      locale = language();
      labels = copy[locale];
      status.textContent = labels.empty;
      if (loadMore) loadMore.textContent = labels.loadMore;
      if (filters) {
        filters.setAttribute('aria-label', labels.categories);
        filters.innerHTML = '<button type="button" class="article-filter-chip" data-category="" aria-pressed="true">' + labels.all + '</button>' +
          categories.map(function (category) {
            return '<button type="button" class="article-filter-chip" data-category="' + escapeHtml(category) + '" aria-pressed="' + String(category === selected) + '">' + escapeHtml(category) + '</button>';
          }).join('');
      }
      display();
    }

    if (filters) {
      filters.addEventListener('click', function (event) {
        var button = event.target.closest('[data-category]');
        if (!button) return;
        selected = button.dataset.category;
        count = options.limit || articles.length;
        display();
      });
    }
    if (loadMore) {
      loadMore.addEventListener('click', function () {
        count += options.limit || 6;
        display();
      });
    }
    renderers.push(updateLanguage);
    updateLanguage();
  }

  function makeSection(kind) {
    var locale = language();
    var labels = copy[locale];
    var section = document.createElement('section');
    section.className = 'section article-section article-section-' + kind;
    section.dataset.articleSectionKind = kind;
    section.setAttribute('aria-labelledby', 'article-section-title-' + kind);
    section.innerHTML = '<div class="shell">' +
      '<div class="section-head"><span class="kicker">' + (kind === 'related' ? labels.related : labels.eyebrow) + '</span>' +
      '<h2 id="article-section-title-' + kind + '">' + labels.title + '</h2>' +
      '<p>' + labels.description + '</p></div>' +
      '<div class="article-grid" data-article-grid aria-live="polite"></div>' +
      '<p class="article-empty" data-article-status role="status" hidden></p>' +
      '<div class="article-section-actions"><a class="button secondary" href="' + (locale === 'ar' ? '/ar/articles/' : '/articles/') + '">' + (locale === 'ar' ? 'عرض كل المقالات' : 'View all articles') + '</a></div>' +
      '</div>';
    return section;
  }

  function updateSectionLanguage(section) {
    var locale = language();
    var labels = copy[locale];
    var kind = section.dataset.articleSectionKind;
    section.querySelector('.section-head .kicker').textContent = kind === 'related' ? labels.related : labels.eyebrow;
    section.querySelector('.section-head h2').textContent = labels.title;
    section.querySelector('.section-head p').textContent = labels.description;
    var allLink = section.querySelector('.article-section-actions a');
    allLink.href = locale === 'ar' ? '/ar/articles/' : '/articles/';
    allLink.textContent = locale === 'ar' ? 'عرض كل المقالات' : 'View all articles';
  }

  function sectionTarget() {
    return document.querySelector('.career-footer, footer');
  }

  function addArticlesNav() {
    var locale = language();
    document.querySelectorAll('.career-links,.nav-links,.platform-links').forEach(function (nav) {
      var link = nav.querySelector('[data-articles-link]') || nav.querySelector('a[aria-current="page"][href*="/articles/"]');
      if (link) {
        link.dataset.articlesLink = '';
        link.href = locale === 'ar' ? '/ar/articles/' : '/articles/';
        if (!link.hasAttribute('aria-current')) link.textContent = locale === 'ar' ? 'المقالات' : 'Articles';
        return;
      }
      link = document.createElement('a');
      link.href = locale === 'ar' ? '/ar/articles/' : '/articles/';
      link.textContent = locale === 'ar' ? 'المقالات' : 'Articles';
      link.dataset.articlesLink = '';
      var switcher = nav.querySelector('.language-switcher');
      if (!switcher) switcher = nav.querySelector('a[hreflang="ar"],a[hreflang="en"]');
      if (switcher) nav.insertBefore(link, switcher);
      else nav.appendChild(link);
    });
  }

  function updateLanguage() {
    document.querySelectorAll('[data-article-section-kind]').forEach(updateSectionLanguage);
    renderers.forEach(function (refresh) { refresh(); });
  }

  function articleKeywords(path) {
    if (path.indexOf('/job-match') === 0) return ['وظائف', 'وظيفة', 'توظيف', 'مهارات', 'سيرة ذاتية', 'job', 'match'];
    if (path.indexOf('/roadmap') === 0) return ['خطة', 'تعلّم', 'تعلم', 'مهارات', 'مسار', 'roadmap', 'learning'];
    return ['مهنة', 'مسار مهني', 'وظائف', 'وظيفة', 'careers', 'career'];
  }

  function matchingArticles(articles, path) {
    var terms = articleKeywords(path);
    var matches = articles.map(function (article, index) {
      var text = [article.title, article.excerpt].concat(article.categories || []).join(' ').toLowerCase();
      return { article: article, score: terms.reduce(function (total, term) { return total + (text.indexOf(term.toLowerCase()) >= 0 ? 1 : 0); }, 0), index: index };
    }).filter(function (item) { return item.score > 0; }).sort(function (a, b) {
      return b.score - a.score || a.index - b.index;
    }).slice(0, 3).map(function (item) { return item.article; });
    if (matches.length === 3) return matches;
    return matches.concat(articles.filter(function (article) {
      return !matches.includes(article);
    }).slice(0, 3 - matches.length));
  }

  function mount(articles) {
    var path = location.pathname.replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    var page = document.querySelector('[data-articles-page]');
    addArticlesNav();

    if (page) {
      render(page, articles, { limit: 6, loadMore: true });
      return;
    }

    var target = sectionTarget();
    if (!target) return;
    if (path === '/' || path === '/ar') {
      var home = makeSection('latest');
      target.parentNode.insertBefore(home, target);
      render(home, articles.slice(0, 3), { limit: 3, loadMore: false });
      return;
    }
    if (path === '/careers' || path.indexOf('/careers/') === 0 || path === '/job-match' || path === '/roadmap') {
      var related = makeSection('related');
      target.parentNode.insertBefore(related, target);
      render(related, matchingArticles(articles, path), { limit: 3, loadMore: false });
    }
  }

  function start() {
    fetch('/fedniy-articles.json', { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('Article cache request failed with HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) throw new Error('Article cache must contain a JSON array');
        mount(data.filter(safeArticle));
      })
      .catch(function (error) {
        console.warn('Fedniy articles could not be loaded; showing the empty state.', error);
        mount([]);
      });
  }

  var renderers = [];
  document.addEventListener('languagechange', updateLanguage);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
