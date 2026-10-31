/* ============================================================
   Creative ON — motion.js (2026-10-31)
   motion.css 의 카드 마스크 리빌·패럴랙스를 구동한다.
   이 파일과 motion.css 를 index.html 에서 빼면 원상복구된다.
   ============================================================ */
(function () {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  const grid = document.getElementById("workGrid");
  if (!grid) return;
  document.documentElement.classList.add("motion-ready");

  /* ---------- 마스크 리빌: 화면에 15% 들어오면 한 번만 벗겨낸다 ---------- */
  const shown = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const fig = e.target.querySelector(".card__media");
      if (fig) fig.classList.add("is-shown");
      shown.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });

  /* ---------- 패럴랙스: 화면 안에 있는 사진만 계산한다 ---------- */
  const visible = new Set();
  const near = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const fig = e.target.querySelector(".card__media") || e.target;
      e.isIntersecting ? visible.add(fig) : visible.delete(fig);
    });
    tick();
  }, { rootMargin: "120px 0px" });

  let queued = false;
  function tick() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const vh = innerHeight;
      visible.forEach((fig) => {
        const r = fig.getBoundingClientRect();
        const p = (r.top + r.height / 2 - vh / 2) / vh;      // 화면 중앙=0, 위=-, 아래=+
        const max = r.height * 0.055;                          // 여유분(6%)보다 살짝 작게
        const y = Math.max(-max, Math.min(max, -p * max * 1.6));
        fig.firstElementChild && fig.firstElementChild.style.setProperty("--py", y.toFixed(1) + "px");
      });
    });
  }
  addEventListener("scroll", tick, { passive: true });
  addEventListener("resize", tick, { passive: true });

  /* ---------- 카드는 필터를 바꿀 때마다 새로 그려지므로 계속 붙여준다 ---------- */
  function attach() {
    grid.querySelectorAll(".card__media:not([data-motion])").forEach((fig) => {
      fig.dataset.motion = "1";
      const card = fig.closest(".card") || fig;
      shown.observe(card);
      near.observe(card);
    });
  }
  /* ---------- 안전장치: 감시가 늦게 오더라도 화면 안 사진은 반드시 드러낸다 ---------- */
  let failsafe = 0;
  function revealInView() {
    clearTimeout(failsafe);
    failsafe = setTimeout(() => {
      const vh = innerHeight;
      grid.querySelectorAll(".card__media:not(.is-shown)").forEach((fig) => {
        const r = fig.getBoundingClientRect();
        if (r.top < vh * 0.94 && r.bottom > 0) fig.classList.add("is-shown");
      });
    }, 300);
  }
  addEventListener("scroll", revealInView, { passive: true });
  addEventListener("load", revealInView);

  new MutationObserver((muts) => {
    muts.forEach((m) => m.removedNodes.forEach((n) => {
      const fig = n.querySelector && n.querySelector(".card__media");
      if (fig) { near.unobserve(n); shown.unobserve(n); visible.delete(fig); }
    }));
    attach(); revealInView();
  }).observe(grid, { childList: true });
  attach(); revealInView();
})();
