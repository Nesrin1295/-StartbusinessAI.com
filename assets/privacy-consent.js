(function () {
  "use strict";

  var consentKey = "startbusinessai-privacy-choice-v1";
  var adsClient = "ca-pub-8157298524106158";
  var allowAds = !document.currentScript || !document.currentScript.hasAttribute("data-no-ads");

  function readChoice() {
    try {
      return localStorage.getItem(consentKey);
    } catch (error) {
      return null;
    }
  }

  function saveChoice(value) {
    try {
      localStorage.setItem(consentKey, value);
    } catch (error) {
      // The choice remains active for this page when storage is unavailable.
    }
  }

  function updateGoogleConsent(value) {
    if (typeof window.gtag !== "function") return;
    var granted = value === "accepted" ? "granted" : "denied";
    window.gtag("consent", "update", {
      ad_storage: granted,
      analytics_storage: granted,
      ad_user_data: granted,
      ad_personalization: granted
    });
  }

  function loadAds() {
    if (!allowAds) return;
    if (document.querySelector('script[data-startbusinessai-ads]')) return;
    var script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.startbusinessaiAds = "true";
    script.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
      adsClient;
    document.head.appendChild(script);
  }

  function addTrustLinks() {
    var footers = document.querySelectorAll("footer");
    if (!footers.length) return;

    footers.forEach(function (footer) {
      if (footer.querySelector("[data-trust-links]")) return;
      var links = document.createElement("nav");
      links.className = "footer-trust-links";
      links.dataset.trustLinks = "true";
      links.setAttribute("aria-label", "Legal and editorial information");
      links.innerHTML =
        '<a href="/privacy">Privacy</a>' +
        '<a href="/terms">Terms</a>' +
        '<a href="/contact">Contact</a>' +
        '<a href="/editorial-policy">Editorial Policy</a>' +
        '<a href="/advertising-disclosure">Advertising Disclosure</a>' +
        '<button type="button" data-privacy-settings>Privacy settings</button>';
      footer.appendChild(links);
    });
  }

  function addEditorialReview() {
    if (document.body.classList.contains("career-site")) return;
    var article = document.querySelector("main article, article.guide-body");
    if (!article || article.querySelector("[data-editorial-review]")) return;

    var isArabic = document.documentElement.lang === "ar";
    var review = document.createElement("aside");
    review.className = "editorial-review";
    review.dataset.editorialReview = "true";
    review.setAttribute(
      "aria-label",
      isArabic ? "معلومات المراجعة التحريرية" : "Editorial review information"
    );
    review.innerHTML = isArabic
      ? 'تمت المراجعة التحريرية بواسطة <a href="/ar/about">نسرين علي سيد</a> · <a href="/editorial-policy">معايير التحرير</a>'
      : 'Editorially reviewed by <a href="/about">Nesrin Ali Sayed</a> · <a href="/editorial-policy">Editorial standards</a>';
    article.insertBefore(review, article.firstChild);
  }

  function addStyles() {
    if (document.getElementById("privacy-consent-styles")) return;
    var style = document.createElement("style");
    style.id = "privacy-consent-styles";
    style.textContent =
      ".footer-trust-links{border-top:1px solid rgba(255,255,255,.14);display:flex;flex-wrap:wrap;gap:.6rem 1.1rem;justify-content:center;margin:1rem auto 0;max-width:1100px;padding:1rem 1.5rem 0}" +
      ".footer-trust-links a,.footer-trust-links button{background:none;border:0;color:inherit;cursor:pointer;font:inherit;font-size:.78rem;opacity:.78;padding:0;text-decoration:none}" +
      ".footer-trust-links a:hover,.footer-trust-links button:hover{opacity:1;text-decoration:underline}" +
      ".editorial-review{background:#f8fbf8;border:1px solid #dce6de;border-radius:8px;color:#53645a;font-size:.78rem;line-height:1.5;margin:0 0 1.25rem;padding:.7rem .85rem}.editorial-review a{color:#173d2a;font-weight:700;text-decoration:underline}" +
      ".privacy-banner{align-items:flex-start;background:#fff;border:1px solid #dce6de;border-radius:12px;bottom:1rem;box-shadow:0 14px 40px rgba(20,48,34,.18);display:flex;gap:1rem;left:50%;max-width:920px;padding:1rem 1.15rem;position:fixed;transform:translateX(-50%);width:calc(100% - 2rem);z-index:9999}" +
      ".privacy-banner[hidden]{display:none}.privacy-banner__copy{flex:1}.privacy-banner h2{color:#173d2a;font-size:1rem;margin:0 0 .35rem}.privacy-banner p{color:#53645a;font-size:.82rem;line-height:1.55;margin:0}.privacy-banner a{color:#173d2a;text-decoration:underline}" +
      ".privacy-banner__actions{display:flex;gap:.55rem}.privacy-banner button{border:1px solid #173d2a;border-radius:7px;cursor:pointer;font-size:.8rem;font-weight:700;padding:.65rem .85rem}.privacy-accept{background:#173d2a;color:#fff}.privacy-decline{background:#fff;color:#173d2a}" +
      "@media(max-width:700px){.privacy-banner{display:block}.privacy-banner__actions{margin-top:.8rem}.privacy-banner button{flex:1}}";
    document.head.appendChild(style);
  }

  function showBanner() {
    var existing = document.querySelector(".privacy-banner");
    if (existing) {
      existing.hidden = false;
      return;
    }

    var banner = document.createElement("section");
    banner.className = "privacy-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-modal", "false");
    banner.setAttribute("aria-labelledby", "privacy-banner-title");
    banner.innerHTML =
      '<div class="privacy-banner__copy">' +
      '<h2 id="privacy-banner-title">Your privacy choices</h2>' +
      "<p>We use necessary storage to operate this site. With your permission, Google may use cookies or similar technologies to provide and measure advertising. You can decline optional advertising storage and still use the site. Read our <a href=\"/privacy\">Privacy Policy</a>.</p>" +
      "</div>" +
      '<div class="privacy-banner__actions">' +
      '<button class="privacy-decline" type="button" data-consent="declined">Decline optional</button>' +
      '<button class="privacy-accept" type="button" data-consent="accepted">Accept</button>' +
      "</div>";
    document.body.appendChild(banner);
  }

  function initialise() {
    addStyles();
    addTrustLinks();
    addEditorialReview();

    var choice = readChoice();
    if (choice) updateGoogleConsent(choice);
    if (choice === "accepted") loadAds();
    if (!choice) showBanner();

    document.addEventListener("click", function (event) {
      var consentButton = event.target.closest("[data-consent]");
      if (consentButton) {
        var value = consentButton.getAttribute("data-consent");
        saveChoice(value);
        updateGoogleConsent(value);
        var banner = document.querySelector(".privacy-banner");
        if (banner) banner.hidden = true;
        if (value === "accepted") loadAds();
      }

      if (event.target.closest("[data-privacy-settings]")) showBanner();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise);
  } else {
    initialise();
  }
})();
