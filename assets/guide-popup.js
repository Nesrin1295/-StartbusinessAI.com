(function () {
  "use strict";

  var storageKey = "startbusinessai-guide-popup-dismissed";
  var dismissedFor = 7 * 24 * 60 * 60 * 1000;
  var popup;
  var closeButton;
  var hasOpened = false;

  try {
    var dismissedAt = Number(localStorage.getItem(storageKey));
    if (dismissedAt && Date.now() - dismissedAt < dismissedFor) return;
  } catch (error) {
    // The popup still works when browser storage is unavailable.
  }

  function closePopup() {
    if (!popup) return;
    popup.hidden = true;
    document.body.classList.remove("guide-popup-open");
    try {
      localStorage.setItem(storageKey, String(Date.now()));
    } catch (error) {
      // Dismissal simply will not persist when storage is unavailable.
    }
  }

  function openPopup() {
    if (!popup || hasOpened) return;
    hasOpened = true;
    popup.hidden = false;
    document.body.classList.add("guide-popup-open");
    closeButton.focus();
  }

  function readerHasEngaged() {
    var pageHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    var scrollable = pageHeight - window.innerHeight;
    return scrollable > 0 && window.scrollY / scrollable >= 0.5;
  }

  function watchReadingProgress() {
    if (!readerHasEngaged()) return;
    window.removeEventListener("scroll", watchReadingProgress);
    openPopup();
  }

  function initialise() {
    popup = document.createElement("div");
    popup.className = "guide-resource-popup";
    popup.hidden = true;
    popup.innerHTML =
      '<div class="guide-resource-popup__backdrop" data-guide-popup-close></div>' +
      '<section class="guide-resource-popup__dialog" role="dialog" aria-modal="true" aria-labelledby="guide-popup-title">' +
      '<button class="guide-resource-popup__close" type="button" aria-label="Close" data-guide-popup-close>&times;</button>' +
      '<div class="guide-resource-popup__eyebrow">Free guide resources</div>' +
      '<h2 id="guide-popup-title">Turn what you learned into one practical next step</h2>' +
      '<p>Use the free prompt packs for planning, creating samples, and reaching your first potential client.</p>' +
      '<div class="guide-resource-popup__actions">' +
      '<a class="guide-resource-popup__primary" href="ai-prompt-pack-business.html">Explore Prompt Packs</a>' +
      '<a class="guide-resource-popup__secondary" href="https://www.linkedin.com/company/startbusinessai/" target="_blank" rel="noopener noreferrer">Join the Community</a>' +
      "</div></section>";
    document.body.appendChild(popup);
    closeButton = popup.querySelector(".guide-resource-popup__close");

    popup.addEventListener("click", function (event) {
      if (event.target.closest("[data-guide-popup-close]")) closePopup();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !popup.hidden) closePopup();
    });
    window.addEventListener("scroll", watchReadingProgress, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise);
  } else {
    initialise();
  }
})();
