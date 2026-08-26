/* Nomad Ink by Jess · concept build
   Vanilla JS only: nav state, ticker loop, reveal-on-scroll, gallery
   filter, lightbox viewer, and the demo inquiry form (consult-first:
   the live build delivers to Jess, a Stripe deposit link can slot in
   beside the submit button later without touching this logic). */

(function () {
  "use strict";

  /* ---------- footer year ---------- */

  document.getElementById("year").textContent = String(new Date().getFullYear());

  /* ---------- nav: scrolled state + active section ---------- */

  var nav = document.getElementById("siteNav");
  var sectionLinks = Array.prototype.slice.call(
    document.querySelectorAll(".nav-links a[href^='#']")
  );

  function onScroll() {
    if (window.scrollY > 24) {
      nav.classList.add("is-scrolled");
    } else {
      nav.classList.remove("is-scrolled");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if ("IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          sectionLinks.forEach(function (link) {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === "#" + entry.target.id
            );
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    ["work", "events", "about", "inquire"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });
  }

  /* ---------- ticker: duplicate content for a seamless loop ---------- */

  var track = document.getElementById("tickerTrack");
  if (track) {
    track.innerHTML += track.innerHTML;
  }

  /* ---------- reveal on scroll ---------- */

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- gallery filter ---------- */

  var filterBtns = document.querySelectorAll(".filter-btn");
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll(".g-item"));

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");

      var filter = btn.getAttribute("data-filter");
      galleryItems.forEach(function (item) {
        var show = filter === "all" || item.getAttribute("data-style") === filter;
        item.classList.toggle("is-hidden", !show);
      });
    });
  });

  /* ---------- lightbox ---------- */

  var lightbox = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbCaption = document.getElementById("lbCaption");
  var lbClose = document.getElementById("lbClose");
  var lbPrev = document.getElementById("lbPrev");
  var lbNext = document.getElementById("lbNext");
  var visibleItems = [];
  var current = 0;
  var lastFocused = null;

  function renderLightbox() {
    var item = visibleItems[current];
    if (!item) return;
    var img = item.querySelector("img");
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    var tags = item.getAttribute("data-tag") || "";
    var healed = item.getAttribute("data-healed");
    if (healed) tags += " · " + healed;
    lbCaption.innerHTML = "";
    lbCaption.appendChild(document.createTextNode(item.getAttribute("data-caption") || ""));
    var tagLine = document.createElement("span");
    tagLine.className = "lb-tags";
    tagLine.textContent = tags;
    lbCaption.appendChild(tagLine);
  }

  function openLightbox(item) {
    visibleItems = galleryItems.filter(function (i) {
      return !i.classList.contains("is-hidden");
    });
    current = visibleItems.indexOf(item);
    if (current < 0) current = 0;
    lastFocused = document.activeElement;
    renderLightbox();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function step(dir) {
    if (!visibleItems.length) return;
    current = (current + dir + visibleItems.length) % visibleItems.length;
    renderLightbox();
  }

  galleryItems.forEach(function (item) {
    item.addEventListener("click", function () {
      openLightbox(item);
    });
  });

  lbClose.addEventListener("click", closeLightbox);
  lbPrev.addEventListener("click", function () { step(-1); });
  lbNext.addEventListener("click", function () { step(1); });

  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", function (event) {
    if (lightbox.hidden) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") step(-1);
    if (event.key === "ArrowRight") step(1);
  });

  /* ---------- events CTA preselects the inquiry type ---------- */

  var typeSelect = document.getElementById("inqType");
  Array.prototype.slice.call(document.querySelectorAll("[data-preselect]")).forEach(function (cta) {
    cta.addEventListener("click", function () {
      typeSelect.value = cta.getAttribute("data-preselect");
    });
  });

  /* ---------- demo inquiry flow ---------- */

  var inqForm = document.getElementById("inquireForm");
  var inqError = document.getElementById("inqError");
  var inqSuccess = document.getElementById("inqSuccess");
  var inqSummary = document.getElementById("inqSummary");
  var inqReset = document.getElementById("inqReset");

  var TYPE_LABELS = {
    tattoo: "a tattoo",
    event: "an event (wedding, bach, party)",
    sip: "a Sip and Shop night",
    coverup: "a cover-up",
    pmu: "PMU brows",
    other: "something else"
  };

  inqForm.addEventListener("submit", function (event) {
    event.preventDefault();

    var name = document.getElementById("inqName").value.trim();
    var contact = document.getElementById("inqContact").value.trim();
    var type = typeSelect.value;

    if (!name || !contact || !type) {
      inqError.hidden = false;
      if (!name) document.getElementById("inqName").focus();
      else if (!type) typeSelect.focus();
      else document.getElementById("inqContact").focus();
      return;
    }
    inqError.hidden = true;

    var placement = document.getElementById("inqPlacement").value.trim();
    var dates = document.getElementById("inqDates").value.trim();

    var summary = name + " is asking about " + (TYPE_LABELS[type] || type) + ".";
    if (placement) summary += " Placement and size: " + placement + ".";
    if (dates) summary += " Preferred dates: " + dates + ".";
    inqSummary.textContent = summary;

    inqForm.hidden = true;
    inqSuccess.hidden = false;
    inqSuccess.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  inqReset.addEventListener("click", function () {
    inqSuccess.hidden = true;
    inqForm.hidden = false;
    inqForm.scrollIntoView({ behavior: "smooth", block: "center" });
  });
})();
