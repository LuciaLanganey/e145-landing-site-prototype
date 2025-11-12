fetch("/api/env")
  .then(res => res.json())
  .then(data => {
    const { siteName } = data;

    // Make site name globally available
    window.__SITE_NAME__ = siteName;

    // Update title and placeholders
    document.title = `${siteName} — Find Your Perfect Thrift. Browse Online, Buy Local.`;
    document.querySelectorAll(".brand-name").forEach(el => {
      el.textContent = siteName;
    });
    document.body.innerHTML = document.body.innerHTML.replaceAll("{{SITE_NAME}}", siteName);
    document.body.dataset.loading = "false";
    document.body.style.visibility = "visible";
  })
  .catch(err => console.error("Error loading site name:", err));

// Click tracking
document.querySelectorAll("[data-event]").forEach((el) => {
  el.addEventListener("click", (e) => {
    const name = el.dataset.event || "cta_click";
    // custom params you want to track
    const params = {
      event_label: el.textContent?.trim().slice(0, 50) || name,
      page_location: window.location.pathname,
      site_name: window.__SITE_NAME__ || "Unknown Site",
    };
    if (window.gtag) gtag("event", name, params);
  });
});

// Impression tracking
const impressionEls = document.querySelectorAll("[data-impression]");
if ("IntersectionObserver" in window && impressionEls.length) {
  const seen = new Set();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.25) {
          const key = entry.target.dataset.impression;
          if (!seen.has(key)) {
            seen.add(key);
            gtag("event", "impression", {
              impression_name: key,
              page_location: location.pathname,
              site_name: window.__SITE_NAME__ || "Unknown Site",
            });
          }
        }
      });
    },
    { threshold: [0.25] }
  );

  impressionEls.forEach((el) => io.observe(el));
}

// Simple time-on-page send on unload
(function () {
  const start = Date.now();
  function sendTime() {
    const seconds = Math.round((Date.now() - start) / 1000);
    if (window.gtag) {
      // 'time_on_page' is a custom event name — you can mark it as conversion if desired
      gtag("event", "time_on_page", {
        seconds_on_page: seconds,
        page_location: window.location.pathname,
        site_name: window.__SITE_NAME__ || "Unknown Site",
      });
    }
  }
  // try to send with navigator.sendBeacon for reliability
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sendTime();
  });
  window.addEventListener("beforeunload", sendTime);
})();

// Track Tally form submissions
window.addEventListener("message", (e) => {
  if (!e.origin.includes("tally.so")) return;
  try {
    const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
    if (data?.type === "tally.submit") {
      // e.g., send GA event
      if (window.gtag)
        gtag("event", "tally_form_submit", {
          form_id: data?.formId || "tally",
          page_location: window.location.pathname,
          site_name: window.__SITE_NAME__ || "Unknown Site",
        });
    }
  } catch (err) {
    /* ignore parse errors */
  }
});
