(function () {
  'use strict';

  var scriptUrl = document.currentScript && document.currentScript.src;
  var logoUrl = scriptUrl ? new URL('career-logo.svg', scriptUrl).href : 'assets/career-logo.svg';
  var oldHeaders = document.querySelectorAll('body > nav, .career-nav, body > header nav');
  oldHeaders.forEach(function (header) {
    header.remove();
  });

  var header = document.createElement('header');
  header.className = 'site-global-header';
  header.innerHTML = '<nav class="site-global-nav" aria-label="Main navigation">' +
    '<a class="site-global-logo" href="/" aria-label="StartBusinessAI home">' +
    '<img src="' + logoUrl + '" alt="StartBusinessAI" width="336" height="120"></a>' +
    '<ul class="site-global-links">' +
    '<li><a href="/#ideas">Ideas</a></li>' +
    '<li><a href="/#guide">How to Start</a></li>' +
    '<li><a href="/#articles">Guides</a></li>' +
    '<li><a href="/ai-agents">AI Agents</a></li>' +
    '<li><a href="/#faq">FAQ</a></li>' +
    '</ul></nav>';

  document.body.insertBefore(header, document.body.firstChild);
})();
