/* ============================================================
   Creative ON — script.js
   데이터는 data/projects.js 에서 읽는다. 여기는 손댈 일 거의 없음.
   ============================================================ */
(function () {
  const S = window.SITE || {};
  const P = window.PROJECTS || [];
  const IMG = (name) => `assets/img/${name}.webp`;
  const THUMB = (name) => `assets/img/${name}-t.webp`;
  const WHO = { all: "그냥 구경하는 사람", gov: "지자체·공공기관 담당자", corp: "기업 홍보·총무 담당자", agency: "기획사·제작사 동료" };
  const WHAT = { all: "모든 행사", festival: "축제", show: "공연 · 콘서트", ceremony: "기념식 · 공식행사", corp: "기업행사" };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- nav ---------- */
  const nav = $("#nav");
  const burger = $("#navBurger");
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open);
    document.body.classList.toggle("is-locked", open);
  });
  $$("#navMenu a").forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("is-open"); document.body.classList.remove("is-locked");
  }));

  // 밝은 섹션 위에서는 네비를 검정으로, 스크롤 시 반투명 배경
  const darkSections = $$(".hero, .process, .foot");
  function syncNav() {
    const y = 40; // 네비 중앙 높이
    const onDark = darkSections.some(s => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom >= y; });
    nav.classList.toggle("is-light", !onDark);
    nav.classList.toggle("is-scrolled", scrollY > 80);
  }
  addEventListener("scroll", syncNav, { passive: true }); syncNav();

  /* ---------- hero slider (Cheil-style work first) ---------- */
  const heroItems = P.filter(p => p.hero).slice(0, 6);
  const slidesEl = $("#heroSlides");
  const indexEl = $("#heroIndex");
  const capClient = $(".hero__caption-client");
  const capTitle = $(".hero__caption-title");
  const DUR = 6000;
  let cur = 0, timer = null;

  heroItems.forEach((p, i) => {
    const d = document.createElement("div");
    d.className = "hero__slide";
    d.style.backgroundImage = `url("${IMG(p.cover)}")`;
    slidesEl.appendChild(d);
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.textContent = String(i + 1).padStart(2, "0");
    b.style.setProperty("--dur", DUR + "ms");
    b.addEventListener("click", () => go(i, true));
    li.appendChild(b); indexEl.appendChild(li);
  });

  function go(i, manual) {
    cur = (i + heroItems.length) % heroItems.length;
    $$(".hero__slide").forEach((s, k) => s.classList.toggle("is-active", k === cur));
    $$("#heroIndex button").forEach((b, k) => {
      b.classList.remove("is-active");
      if (k === cur) { void b.offsetWidth; b.classList.add("is-active"); } // restart bar animation
    });
    const p = heroItems[cur];
    capClient.textContent = `${p.client} · ${p.year}`;
    capTitle.textContent = `${p.title} — ${p.role}`;
    if (manual) restart();
  }
  function restart() { clearInterval(timer); timer = setInterval(() => go(cur + 1), DUR); }
  if (heroItems.length) { go(0); restart(); }
  document.addEventListener("visibilitychange", () => document.hidden ? clearInterval(timer) : restart());

  /* ---------- sentence filter (HSAD-style) ---------- */
  const state = { who: "all", what: "all" };
  $$(".sentence__slot").forEach(slot => {
    const btn = $(".sentence__btn", slot);
    const menu = $(".sentence__menu", slot);
    const key = btn.dataset.slot;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = slot.classList.contains("is-open");
      $$(".sentence__slot").forEach(s => s.classList.remove("is-open"));
      if (!open) slot.classList.add("is-open");
    });
    $$("li", menu).forEach(li => li.addEventListener("click", () => {
      state[key] = li.dataset.value;
      $("[data-label]", btn).textContent = li.textContent;
      $$("li", menu).forEach(x => x.classList.toggle("is-selected", x === li));
      slot.classList.remove("is-open");
      renderGrid();
    }));
  });
  document.addEventListener("click", () => $$(".sentence__slot").forEach(s => s.classList.remove("is-open")));

  /* ---------- work grid ---------- */
  const grid = $("#workGrid");
  const countEl = $("#workCount");
  function renderGrid() {
    const list = P.filter(p =>
      (state.who === "all" || state.who === "agency" || p.who.includes(state.who)) &&
      (state.what === "all" || p.what.includes(state.what))
    );
    grid.innerHTML = "";
    countEl.textContent = list.length
      ? `${list.length}개 프로젝트 · ${WHO[state.who]} · ${WHAT[state.what]}`
      : "";
    if (!list.length) {
      grid.innerHTML = `<p class="grid__empty">해당 조건의 공개 사례가 아직 없습니다. 아카이브 또는 문의로 확인해 주세요.</p>`;
      return;
    }
    list.forEach((p, i) => {
      const a = document.createElement("article");
      a.className = "card";
      a.style.animationDelay = (i * 60) + "ms";
      a.innerHTML = `
        <div class="card__img"><img src="${THUMB(p.cover)}" alt="${p.title}" loading="lazy"></div>
        <div class="card__body">
          <h3 class="card__title">${p.title}</h3>
          <span class="card__year">${p.year}</span>
          <p class="card__client">${p.client}</p>
          <p class="card__role">${p.role}</p>
          <div class="card__tags">${p.what.map(w => `<span>${WHAT[w]}</span>`).join("")}</div>
        </div>`;
      a.addEventListener("click", () => openModal(p));
      grid.appendChild(a);
    });
  }
  renderGrid();

  /* ---------- modal ---------- */
  const modal = $("#modal");
  function openModal(p) {
    $("#modalGallery").innerHTML = p.images.map(n => `<img src="${IMG(n)}" alt="${p.title}" loading="lazy">`).join("");
    $("#modalMeta").textContent = `${p.year}.${p.month} · ${p.client}`;
    $("#modalTitle").textContent = p.title;
    $("#modalRole").textContent = p.role;
    $("#modalSummary").textContent = p.summary;
    $("#modalPoints").innerHTML = p.points.map(x => `<li>${x}</li>`).join("");
    $("#modalOrg").textContent = p.org ? `수행 당시 소속: ${p.org}` : "";
    modal.classList.add("is-open"); modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    $(".modal__panel").scrollTop = 0;
  }
  function closeModal() {
    modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
  }
  $$("[data-close]", modal).forEach(el => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

  /* ---------- career / archive ---------- */
  $("#career").innerHTML = (window.CAREER || []).map(([y, t, d]) =>
    `<li><b>${y}</b><div>${t}<span>${d}</span></div></li>`).join("");
  $("#archiveTable tbody").innerHTML = (window.ARCHIVE || []).map(([y, t, r]) =>
    `<tr><td>${y}</td><td>${t}</td><td>${r}</td></tr>`).join("");

  /* ---------- count-up ---------- */
  const countObs = new IntersectionObserver((es) => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || "";
    const start = end > 100 ? end - 40 : 0, t0 = performance.now(), D = 1200;
    (function tick(t) {
      const k = Math.min(1, (t - t0) / D), v = Math.round(start + (end - start) * (1 - Math.pow(1 - k, 3)));
      el.textContent = v + suf; if (k < 1) requestAnimationFrame(tick);
    })(t0);
    countObs.unobserve(el);
  }), { threshold: .6 });
  $$("[data-count]").forEach(el => countObs.observe(el));

  /* ---------- reveal ---------- */
  const revObs = new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); revObs.unobserve(e.target); }
  }), { threshold: .12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach(el => revObs.observe(el));

  /* ---------- contact form ---------- */
  const form = $("#contactForm");
  const status = $("#formStatus");
  const mail = S.email || "";
  $("#mailLink").href = `mailto:${mail}`;
  $("#mailLink").textContent = mail;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { status.textContent = "이름, 이메일, 내용은 필수입니다."; status.className = "form__status is-err"; return; }
    const fd = new FormData(form);
    const body = [...fd.entries()].map(([k, v]) => `${k}: ${v}`).join("\n");
    if (S.form_endpoint) {
      status.textContent = "보내는 중…"; status.className = "form__status";
      try {
        const r = await fetch(S.form_endpoint, { method: "POST", body: fd, headers: { Accept: "application/json" } });
        if (!r.ok) throw new Error(r.status);
        status.textContent = "접수됐습니다. 영업일 기준 1일 안에 답장드립니다."; status.className = "form__status is-ok"; form.reset();
      } catch (err) {
        status.textContent = "전송 실패. 이메일로 직접 보내주세요."; status.className = "form__status is-err";
      }
    } else {
      // Formspree 연결 전: 이메일 앱으로 내용 넘김
      const subject = encodeURIComponent(`[Creative ON 문의] ${fd.get("type")} · ${fd.get("name")}`);
      location.href = `mailto:${mail}?subject=${subject}&body=${encodeURIComponent(body)}`;
      status.textContent = "이메일 앱이 열립니다. 열리지 않으면 주소를 복사해 직접 보내주세요."; status.className = "form__status";
    }
  });

  /* ---------- misc ---------- */
  $("#year").textContent = new Date().getFullYear();
})();
