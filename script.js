/* ==========================================================================
   סיון חבלצקי — landing page behaviour
   Vanilla JS, no dependencies.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------------------------
     1. Sticky header — scrolled state
     ------------------------------------------------------------------ */

  var header = document.getElementById("site-header");

  if (header) {
    // Publish the header's real height so the hero can be exactly one
    // screen tall underneath it.
    var setHeaderHeight = function () {
      document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
    };
    setHeaderHeight();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(setHeaderHeight).catch(function () {});
    }
    var headerResizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(headerResizeTimer);
      headerResizeTimer = setTimeout(setHeaderHeight, 150);
    });

    var lastScrolled = null;
    var onScroll = function () {
      var scrolled = window.scrollY > 8;
      if (scrolled !== lastScrolled) {
        header.classList.toggle("is-scrolled", scrolled);
        lastScrolled = scrolled;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ------------------------------------------------------------------
     2. Mobile navigation
     ------------------------------------------------------------------ */

  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");

  function closeNav() {
    if (!navToggle || !nav) return;
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "פתיחת תפריט הניווט");
    nav.classList.remove("is-open");
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      navToggle.setAttribute("aria-label", open ? "פתיחת תפריט הניווט" : "סגירת תפריט הניווט");
      nav.classList.toggle("is-open", !open);
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        closeNav();
        navToggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1200) closeNav();
    });
  }

  /* ------------------------------------------------------------------
     3. Accordions (results cards + FAQ)
     One item open at a time within each group.
     ------------------------------------------------------------------ */

  function itemRootOf(trigger) {
    return trigger.closest(".acc, .faq__item");
  }

  document.querySelectorAll("[data-accordion]").forEach(function (group) {
    var triggers = Array.prototype.slice.call(
      group.querySelectorAll("[aria-controls][aria-expanded]")
    );
    if (!triggers.length) return;

    function setOpen(trigger, open) {
      var root = itemRootOf(trigger);
      var panel = document.getElementById(trigger.getAttribute("aria-controls"));
      if (!root || !panel) return;
      trigger.setAttribute("aria-expanded", String(open));
      root.classList.toggle("is-open", open);
      panel.setAttribute("aria-hidden", String(!open));
    }

    // Sync the initial DOM state (the first results card ships open).
    triggers.forEach(function (t) {
      setOpen(t, t.getAttribute("aria-expanded") === "true");
    });

    triggers.forEach(function (trigger, index) {
      trigger.addEventListener("click", function () {
        var willOpen = trigger.getAttribute("aria-expanded") !== "true";
        triggers.forEach(function (other) {
          setOpen(other, other === trigger ? willOpen : false);
        });
      });

      trigger.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowDown") next = triggers[(index + 1) % triggers.length];
        else if (e.key === "ArrowUp") next = triggers[(index - 1 + triggers.length) % triggers.length];
        else if (e.key === "Home") next = triggers[0];
        else if (e.key === "End") next = triggers[triggers.length - 1];
        if (next) {
          e.preventDefault();
          next.focus();
        }
      });
    });
  });

  /* ------------------------------------------------------------------
     4. Rolling pills — seamless left-to-right marquee
     ------------------------------------------------------------------ */

  var SPEED_PX_PER_SEC = 42; // calm, readable

  document.querySelectorAll("[data-marquee]").forEach(function (marquee) {
    var track = marquee.querySelector("[data-marquee-track]");
    if (!track) return;

    var originals = Array.prototype.slice.call(track.children);
    if (!originals.length) return;

    if (reduceMotion.matches) return; // static, horizontally scrollable row

    // Duplicate the sequence so the loop never shows a gap.
    originals.forEach(function (node) {
      var clone = node.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });

    function measure() {
      var gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0;
      var first = originals[0];
      var last = originals[originals.length - 1];
      var setWidth = last.offsetLeft + last.offsetWidth - first.offsetLeft + gap;
      if (!setWidth || !isFinite(setWidth)) return;
      track.style.setProperty("--marquee-shift", setWidth + "px");
      marquee.style.setProperty("--marquee-duration", setWidth / SPEED_PX_PER_SEC + "s");
      track.style.animationName = "none";
      // force reflow so the new duration/keyframes take effect cleanly
      void track.offsetWidth;
      track.style.animationName = "";
      marquee.classList.add("is-ready");
    }

    // Inject keyframes that shift by an exact pixel amount (percentages would
    // land mid-sequence once the list is duplicated).
    var styleEl = document.createElement("style");
    styleEl.textContent =
      "@keyframes pills-scroll {" +
      "from { transform: translate3d(calc(-1 * var(--marquee-shift, 50%)), 0, 0); }" +
      "to   { transform: translate3d(0, 0, 0); } }";
    document.head.appendChild(styleEl);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure).catch(measure);
    } else {
      measure();
    }
    measure();

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 200);
    });

    // Touch: pause while the finger is down, resume after — page scroll is
    // never blocked because we attach passive listeners only.
    marquee.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch") marquee.classList.add("is-paused");
    }, { passive: true });

    ["pointerup", "pointercancel", "pointerleave"].forEach(function (evt) {
      marquee.addEventListener(evt, function () {
        marquee.classList.remove("is-paused");
      }, { passive: true });
    });
  });

  /* ------------------------------------------------------------------
     4b. Recommendations carousel
     3 cards per view (2 / 1 responsively), auto-advancing one card at a
     time, with arrow navigation. Pauses on hover, on keyboard focus and
     while off-screen; does not auto-rotate under reduced-motion.
     ------------------------------------------------------------------ */

  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var track = root.querySelector("[data-carousel-track]");
    var slides = Array.prototype.slice.call(root.querySelectorAll("[data-carousel-slide]"));
    var prevBtn = root.querySelector("[data-carousel-prev]");
    var nextBtn = root.querySelector("[data-carousel-next]");
    var status = root.querySelector("[data-carousel-status]");
    if (!track || slides.length < 2) return;

    var interval = parseInt(root.getAttribute("data-carousel-interval"), 10) || 6000;
    var index = 0;
    var timer = null;
    var hovered = false;
    var focused = false;
    var visible = true;

    function perView() {
      var v = parseFloat(getComputedStyle(track).getPropertyValue("--cards-per-view"));
      return Math.max(1, Math.round(v || 1));
    }

    function maxIndex() {
      return Math.max(0, slides.length - perView());
    }

    function step() {
      var gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0;
      return slides[0].getBoundingClientRect().width + gap;
    }

    // The paper texture is one sheet anchored to the viewport, not a copy per
    // card. Each card offsets the shared image by its own distance from the
    // viewport edge, so together the cards read as windows onto one texture.
    // offsetLeft ignores transforms, which is exactly what we want: it gives
    // the card's untranslated position, and we add the applied translate.
    function paintTexture(translateX) {
      var viewport = root.querySelector(".recs__viewport");
      if (!viewport) return;
      track.style.setProperty("--tex-w", viewport.offsetWidth + "px");
      slides.forEach(function (slide) {
        slide.style.setProperty("--tex-x", -(slide.offsetLeft + translateX) + "px");
      });
    }

    function render() {
      var rtl = getComputedStyle(track).direction === "rtl";
      var offset = index * step();
      var translateX = rtl ? offset : -offset;
      track.style.transform = "translate3d(" + translateX + "px, 0, 0)";
      paintTexture(translateX);

      // slides outside the viewport must not be reachable by Tab
      var pv = perView();
      slides.forEach(function (s, i) {
        var inView = i >= index && i < index + pv;
        s.setAttribute("aria-hidden", String(!inView));
        s.toggleAttribute("inert", !inView);
      });

      if (status) {
        var last = Math.min(index + pv, slides.length);
        status.textContent = last === index + 1
          ? "מציג המלצה " + last + " מתוך " + slides.length
          : "מציג המלצות " + (index + 1) + "–" + last + " מתוך " + slides.length;
      }
    }

    function goTo(next) {
      var max = maxIndex();
      index = next < 0 ? max : next > max ? 0 : next;
      render();
    }

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    function start() {
      stop();
      if (reduceMotion.matches) return;
      if (hovered || focused || !visible) return;
      if (maxIndex() === 0) return;
      timer = setInterval(function () { goTo(index + 1); }, interval);
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(index - 1); start(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(index + 1); start(); });

    root.addEventListener("mouseenter", function () { hovered = true; stop(); });
    root.addEventListener("mouseleave", function () { hovered = false; start(); });
    // Only keyboard focus pauses playback — a mouse click on an arrow also
    // focuses it, and that should not stop the rotation for good.
    root.addEventListener("focusin", function (e) {
      var kb = e.target && e.target.matches && e.target.matches(":focus-visible");
      if (kb) { focused = true; stop(); }
    });
    root.addEventListener("focusout", function () {
      if (!root.contains(document.activeElement)) { focused = false; start(); }
    });

    root.addEventListener("keydown", function (e) {
      var rtl = getComputedStyle(track).direction === "rtl";
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(rtl ? index - 1 : index + 1); start(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(rtl ? index + 1 : index - 1); start(); }
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }, { threshold: 0.15 }).observe(root);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { goTo(Math.min(index, maxIndex())); }, 150);
    });

    render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(render).catch(function () {});
    start();
  });

  /* ------------------------------------------------------------------
     5. Scroll reveal
     ------------------------------------------------------------------ */

  var revealables = document.querySelectorAll("[data-reveal]");

  revealables.forEach(function (el) {
    var d = el.getAttribute("data-reveal-delay");
    if (d) el.style.setProperty("--reveal-delay", d);
  });

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // run once
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------
     6. Smooth in-page navigation + scroll spy
     ------------------------------------------------------------------ */

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: reduceMotion.matches ? "auto" : "smooth",
        block: "start"
      });
      // move focus for keyboard & screen-reader users
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      if (history.replaceState) history.replaceState(null, "", id);
    });
  });

  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
  var sections = navLinks
    .map(function (l) { return document.querySelector(l.getAttribute("href")); })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (l) {
          var isCurrent = l.getAttribute("href") === "#" + entry.target.id;
          if (isCurrent) l.setAttribute("aria-current", "true");
          else l.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ------------------------------------------------------------------
     7. Graceful handling of not-yet-exported assets
     (safe to delete once assets/ is fully populated)
     ------------------------------------------------------------------ */

  document.querySelectorAll("img").forEach(function (img) {
    img.addEventListener("error", function () { img.classList.add("is-missing"); });
    if (img.complete && img.naturalWidth === 0) img.classList.add("is-missing");
  });

  /* ------------------------------------------------------------------
     8. Contact form
     Submits to the FormSubmit AJAX endpoint so the visitor stays on the
     page. Without JS (or without fetch) the form falls back to a plain
     POST to the same service via its `action` attribute.
     ------------------------------------------------------------------ */

  var CONTACT_EMAIL = "inbal.bruker@tipranks.com";

  var form = document.querySelector(".form");
  if (form) {
    var endpoint = form.getAttribute("data-endpoint");
    var statusEl = form.querySelector("[data-form-status]");
    var submitBtn = form.querySelector('button[type="submit"]');

    var setStatus = function (html, kind) {
      if (!statusEl) return;
      statusEl.innerHTML = html;
      statusEl.className = "form__status form__status--" + kind;
      statusEl.hidden = false;
    };

    var fallbackLine =
      ' אפשר לנסות שוב, או לכתוב ישירות לכתובת <a href="mailto:' +
      CONTACT_EMAIL + '">' + CONTACT_EMAIL + "</a>.";

    form.addEventListener("submit", function (e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        var firstInvalid = form.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // No fetch support → let the browser do a normal POST to `action`.
      if (!endpoint || typeof window.fetch !== "function") return;

      e.preventDefault();

      var label = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "שולח…";
      }
      setStatus("שולח את הפרטים…", "pending");

      fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          return res.json()
            .catch(function () { return {}; })
            .then(function (data) { return { ok: res.ok, data: data }; });
        })
        .then(function (result) {
          // FormSubmit answers 200 even when it refuses the submission (for
          // example while the destination address is still unconfirmed), so
          // the JSON `success` flag has to be checked as well as the status.
          var data = result.data || {};
          var accepted = result.ok && String(data.success) === "true";

          if (accepted) {
            form.reset();
            setStatus("תודה! הפרטים נשלחו ונחזור אליכם בהקדם.", "ok");
          } else {
            if (window.console && data.message) {
              console.warn("[contact form] rejected by the mail relay:", data.message);
            }
            setStatus("השליחה נכשלה." + fallbackLine, "error");
          }
        })
        .catch(function (err) {
          // Network-level failure (offline, DNS, CORS) — distinct from the
          // relay accepting the request but refusing the submission above.
          if (window.console) {
            console.error("[contact form] could not reach the mail relay:", err);
          }
          setStatus("לא הצלחנו לשלוח כרגע." + fallbackLine, "error");
        })
        .then(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = label;
          }
        });
    });
  }
})();
