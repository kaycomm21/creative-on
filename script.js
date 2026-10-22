/* ============================================================
   Creative ON - script.js (v0.2)
   데이터는 data/projects.js 에서 읽는다. 여기는 손댈 일 거의 없음.
   프로젝트 상세 주소: index.html#p/<id>  (예: #p/yeongcheon-2025)
   ============================================================ */
(function () {
  const S = window.SITE || {};
  const P = window.PROJECTS || [];
  const A = window.ARCHIVE || [];
  const IMG = (n) => `assets/img/${n}.webp`;
  const THUMB = (n) => `assets/img/${n}-t.webp`;
  const WHO = { all: "그냥 구경하는 사람", gov: "지자체·공공기관 담당자", corp: "기업 홍보·총무 담당자", agency: "기획사·제작사 동료" };
  const WHAT = { all: "모든 행사", festival: "축제", show: "공연, 콘서트", ceremony: "기념식, 공식행사", corp: "기업행사" };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (t) => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- nav ---------- */
  const nav = $("#nav");
  const burger = $("#navBurger");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    document.body.classList.toggle("is-locked", open);
  }
  burger.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  $$("#navMenu a").forEach(a => a.addEventListener("click", () => setMenu(false)));

  // 어두운 섹션 위에서는 흰 글자, 밝은 섹션 위에서는 검정. 아래로 스크롤하면 숨기고 위로 올리면 보인다.
  const darkSections = $$(".hero, .process, .foot");
  const sections = $$("main section[id]");
  let lastY = scrollY;
  function syncNav() {
    const y = 34;
    const onDark = darkSections.some(s => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom >= y; });
    nav.classList.toggle("is-light", !onDark);
    nav.classList.toggle("is-scrolled", scrollY > 60);
    const down = scrollY > lastY && scrollY > 400;
    if (!nav.classList.contains("is-open")) nav.classList.toggle("is-hidden", down);
    lastY = scrollY;
    const cur = sections.filter(s => s.getBoundingClientRect().top < innerHeight * .4).pop();
    $$("#navMenu a").forEach(a => a.classList.toggle("is-current", cur && a.getAttribute("href") === "#" + cur.id));
  }
  addEventListener("scroll", syncNav, { passive: true }); syncNav();

  /* ---------- hero slider (제일기획식 워크 퍼스트) ---------- */
  const hero = $("#hero");
  const heroItems = P.filter(p => p.hero).slice(0, 6);
  const slidesEl = $("#heroSlides");
  const indexEl = $("#heroIndex");
  const capMeta = $(".hero__caption-meta");
  const capTitle = $(".hero__caption-title");
  const DUR = 6500;
  let cur = 0, timer = null, paused = reduce;

  heroItems.forEach((p, i) => {
    const img = document.createElement("img");
    img.className = "hero__slide";
    img.alt = `${p.title} 현장`;
    img.decoding = "async";
    img.dataset.src = IMG(p.cover);
    if (i === 0) { img.src = img.dataset.src; img.fetchPriority = "high"; }
    slidesEl.appendChild(img);
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = String(i + 1).padStart(2, "0");
    b.setAttribute("aria-label", `${i + 1}번째 현장: ${p.title}`);
    b.style.setProperty("--dur", DUR + "ms");
    b.addEventListener("click", () => go(i, true));
    li.appendChild(b); indexEl.appendChild(li);
  });
  const slides = $$(".hero__slide");
  const load = (i) => { const s = slides[(i + slides.length) % slides.length]; if (s && !s.getAttribute("src")) s.src = s.dataset.src; };

  function go(i, manual) {
    if (!heroItems.length) return;
    cur = (i + heroItems.length) % heroItems.length;
    load(cur); load(cur + 1); // 다음 장만 미리 받는다
    slides.forEach((s, k) => s.classList.toggle("is-active", k === cur));
    $$("#heroIndex button").forEach((b, k) => {
      b.classList.remove("is-active");
      b.removeAttribute("aria-current");
      if (k === cur) { void b.offsetWidth; b.classList.add("is-active"); b.setAttribute("aria-current", "true"); }
    });
    const p = heroItems[cur];
    capMeta.textContent = `${p.year} ${p.client}`;
    capTitle.textContent = `${p.title}, ${p.role}`;
    if (manual) restart();
  }
  function restart() { clearInterval(timer); if (!paused) timer = setInterval(() => go(cur + 1), DUR); }
  const pauseBtn = $("#heroPause");
  function setPaused(v) {
    paused = v; hero.classList.toggle("is-paused", v);
    pauseBtn.setAttribute("aria-pressed", v);
    pauseBtn.setAttribute("aria-label", v ? "슬라이드 재생" : "슬라이드 일시정지");
    v ? clearInterval(timer) : go(cur + 1, true);
  }
  pauseBtn.addEventListener("click", () => setPaused(!paused));
  $("#heroOpen").addEventListener("click", () => { location.hash = "p/" + heroItems[cur].id; });
  if (heroItems.length) {
    go(0);
    hero.classList.toggle("is-paused", paused); pauseBtn.setAttribute("aria-pressed", paused);
    restart();
  }
  document.addEventListener("visibilitychange", () => document.hidden ? clearInterval(timer) : restart());

  /* ---------- 사실 숫자: 데이터에서 센다 ---------- */
  $("#factCount").textContent = P.length + A.length;
  $("#arcCount").textContent = A.length;

  /* ---------- sentence filter (HSAD식) ---------- */
  const state = { who: "all", what: "all" };
  const slots = $$(".sentence__slot");
  function closeAll(except) {
    slots.forEach(s => { if (s !== except) { s.classList.remove("is-open"); $(".sentence__btn", s).setAttribute("aria-expanded", "false"); } });
  }
  slots.forEach(slot => {
    const btn = $(".sentence__btn", slot);
    const menu = $(".sentence__menu", slot);
    const opts = $$("li", menu);
    const key = btn.dataset.slot;
    const open = (focusFirst) => {
      closeAll(slot); slot.classList.add("is-open"); btn.setAttribute("aria-expanded", "true");
      if (focusFirst) (opts.find(o => o.getAttribute("aria-selected") === "true") || opts[0]).focus();
    };
    const close = () => { slot.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); };
    btn.addEventListener("click", (e) => { e.stopPropagation(); slot.classList.contains("is-open") ? close() : open(e.detail === 0); });
    btn.addEventListener("keydown", (e) => { if (e.key === "ArrowDown") { e.preventDefault(); open(true); } });
    const pick = (li) => {
      state[key] = li.dataset.value;
      $("[data-label]", btn).textContent = li.textContent;
      opts.forEach(x => x.setAttribute("aria-selected", x === li));
      close(); btn.focus();
      renderGrid(true);
    };
    opts.forEach((li, i) => {
      li.addEventListener("click", (e) => { e.stopPropagation(); pick(li); });
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(li); }
        else if (e.key === "ArrowDown") { e.preventDefault(); opts[(i + 1) % opts.length].focus(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); opts[(i - 1 + opts.length) % opts.length].focus(); }
        else if (e.key === "Escape" || e.key === "Tab") { close(); if (e.key === "Escape") btn.focus(); }
      });
    });
  });
  document.addEventListener("click", () => closeAll());

  /* ---------- work grid ----------
     리듬: 와이드(사진 8 + 글 4) → 반반 → 와이드(좌우 반전) → 반반 ...
     마지막에 반쪽 카드가 혼자 남으면 와이드로 바꿔 빈칸을 만들지 않는다. */
  const grid = $("#workGrid");
  const countEl = $("#workCount");
  let currentList = P;
  function layout(n) {
    const out = []; let i = 0, wide = 0;
    while (i < n) {
      out.push("wide" + (wide++ % 2 ? " flip" : "")); i++;
      if (n - i >= 2) { out.push("half", "half"); i += 2; }
    }
    return out;
  }
  function renderGrid(animate) {
    const list = P.filter(p =>
      (state.who === "all" || state.who === "agency" || p.who.includes(state.who)) &&
      (state.what === "all" || p.what.includes(state.what))
    );
    currentList = list;
    grid.innerHTML = "";
    countEl.textContent = list.length ? `사진으로 남은 현장 ${list.length}곳` : "";
    if (!list.length) {
      grid.innerHTML = `<p class="grid__empty">이 조합의 사진 사례는 아직 없다. <a href="#archive">아카이브</a>에서 이력을 보거나, <a href="#contact">직접 물어보기</a>.</p>`;
      return;
    }
    const kinds = layout(list.length);
    list.forEach((p, i) => {
      const k = kinds[i];
      const wide = k.startsWith("wide");
      const a = document.createElement("a");
      a.className = "card" + (wide ? " card--wide" : "") + (k.includes("flip") ? " card--flip" : "");
      a.href = "#p/" + p.id;
      a.setAttribute("aria-label", `${p.title} 상세 보기`);
      const sizes = wide ? "(max-width: 860px) 100vw, 860px" : "(max-width: 860px) 100vw, 640px";
      a.innerHTML = `
        <figure class="card__media"><img src="${THUMB(p.cover)}" srcset="${THUMB(p.cover)} 640w, ${IMG(p.cover)} 2000w" sizes="${sizes}" alt="${esc(p.title)} 현장 사진" loading="lazy" decoding="async"></figure>
        <div class="card__meta">
          <p class="card__client">${esc(p.client)}</p>
          <h3 class="card__title">${esc(String(p.title).replace(/^\d{4}\s+/, ""))}</h3>
          <p class="card__role">${esc(p.role)}</p>
          <p class="card__tags"><span class="card__year">${p.year}</span>${p.what.map(w => `<span class="card__field">${WHAT[w]}</span>`).join("")}</p>
          ${wide ? `<span class="card__go" aria-hidden="true">현장 보기</span>` : ""}
        </div>`;
      if (animate && !reduce) {
        a.classList.add("is-entering");
        setTimeout(() => a.classList.remove("is-entering"), 30 + i * 45);
      }
      grid.appendChild(a);
    });
  }
  renderGrid(false);

  /* ---------- project detail (hash 라우팅: 공유 가능한 주소) ---------- */
  const modal = $("#modal");
  const panel = $(".modal__panel");
  let lastFocus = null, openId = null;
  function fill(p) {
    const list = currentList.some(x => x.id === p.id) ? currentList : P;
    const idx = list.findIndex(x => x.id === p.id);
    $("#modalCrumb").textContent = `${idx + 1} / ${list.length}`;
    $("#modalMeta").textContent = `${p.year}.${p.month}`;
    $("#modalTitle").textContent = p.title;
    const specEl = $("#modalSpec");
    if (specEl) specEl.innerHTML = [
      ["일시", `${p.year}.${p.month}`],
      ["발주처", p.client],
      ["분야", p.what.map(w => WHAT[w]).join(", ")],
      ["역할", p.role]
    ].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");
    $("#modalSummary").textContent = p.summary;
    $("#modalPoints").innerHTML = p.points.map(x => `<li>${esc(x)}</li>`).join("");
    $("#modalGallery").innerHTML = p.images.map((n, i) =>
      `<figure><img src="${IMG(n)}" alt="${esc(p.title)} 현장 사진 ${i + 1}" ${i ? 'loading="lazy"' : ""} decoding="async"></figure>`).join("");
    const prev = list[(idx - 1 + list.length) % list.length], next = list[(idx + 1) % list.length];
    $("#modalPrev").onclick = () => { location.hash = "p/" + prev.id; };
    $("#modalNext").onclick = () => { location.hash = "p/" + next.id; };
    $("#modalPrev").hidden = $("#modalNext").hidden = list.length < 2;
    panel.scrollTop = 0;
  }
  function openModal(p) {
    if (openId === null) lastFocus = document.activeElement;
    openId = p.id; fill(p);
    modal.classList.add("is-open"); modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    setTimeout(() => $(".modal__close").focus({ preventScroll: true }), 50);
  }
  function closeModal() {
    if (openId === null) return;
    const id = openId; openId = null;
    modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
    if (location.hash.startsWith("#p/")) history.replaceState(null, "", location.pathname + location.search + "#work");
    const card = grid.querySelector(`a[href="#p/${id}"]`);
    (lastFocus && document.contains(lastFocus) ? lastFocus : card)?.focus({ preventScroll: true });
  }
  function route() {
    const m = location.hash.match(/^#p\/(.+)$/);
    const p = m && P.find(x => x.id === decodeURIComponent(m[1]));
    p ? openModal(p) : closeModal();
  }
  addEventListener("hashchange", route); route();
  $$("[data-close]", modal).forEach(el => el.addEventListener("click", closeModal));
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", e => {
    if (openId !== null) {
      if (e.key === "Escape") closeModal();
      else if (e.key === "ArrowRight") $("#modalNext").click();
      else if (e.key === "ArrowLeft") $("#modalPrev").click();
      else if (e.key === "Tab") { // 포커스를 상세 창 안에 가둔다
        const f = $$("button:not([hidden]), a[href]", panel);
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    } else if (e.key === "Escape" && nav.classList.contains("is-open")) setMenu(false);
  });

  /* ---------- profile photo (설정돼 있을 때만) ---------- */
  if (S.profile) {
    const fig = document.createElement("figure");
    fig.className = "about__photo";
    fig.innerHTML = `<img src="${IMG(S.profile)}" alt="연출감독 김영근" loading="lazy" decoding="async">`;
    $(".about__head").prepend(fig);
  }

  /* ---------- career / archive ---------- */
  $("#career").innerHTML = (window.CAREER || []).map(([y, t, d]) =>
    `<li><b>${esc(y)}</b><div><strong>${esc(t)}</strong><span>${esc(d)}</span></div></li>`).join("");
  const byYear = {};
  A.forEach(([y, t, r, c]) => (byYear[y] = byYear[y] || []).push({ t, r, c }));
  $("#archiveList").innerHTML = Object.keys(byYear).sort((a, b) => b - a).map(y => `
    <div class="arc">
      <h3 class="arc__y">${y}</h3>
      <ul>${byYear[y].map(x => `<li><span class="arc__t">${esc(x.t)}</span><span class="arc__r">${esc(x.r)}${x.c && x.c !== "기획/운영" ? ` <em>${esc(x.c)}</em>` : ""}</span></li>`).join("")}</ul>
    </div>`).join("");

  /* ---------- contact ---------- */
  const mail = S.email || "";
  const mailLink = $("#mailLink");
  mailLink.href = `mailto:${mail}`; mailLink.textContent = mail;
  const copyBtn = $("#mailCopy");
  copyBtn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(mail); copyBtn.textContent = "복사됨"; }
    catch (e) { copyBtn.textContent = "직접 복사해 주세요"; }
    copyBtn.classList.add("is-done");
    setTimeout(() => { copyBtn.textContent = "주소 복사"; copyBtn.classList.remove("is-done"); }, 1800);
  });

  const form = $("#contactForm");
  const status = $("#formStatus");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const bad = $$("[required]", form).filter(el => !el.checkValidity());
    $$("[required]", form).forEach(el => el.setAttribute("aria-invalid", bad.includes(el)));
    if (bad.length) {
      status.textContent = "이름, 이메일, 내용을 채워야 보낼 수 있다.";
      status.className = "form__status is-err"; bad[0].focus(); return;
    }
    const fd = new FormData(form);
    const body = [...fd.entries()].map(([k, v]) => `${k}: ${v}`).join("\n");
    if (S.form_endpoint) {
      status.textContent = "보내는 중"; status.className = "form__status";
      try {
        const r = await fetch(S.form_endpoint, { method: "POST", body: fd, headers: { Accept: "application/json" } });
        if (!r.ok) throw new Error(r.status);
        status.textContent = "보냈다. 확인하는 대로 답장한다."; status.className = "form__status is-ok"; form.reset();
      } catch (err) {
        status.textContent = "전송 실패. 위 이메일 주소로 직접 보내 주세요."; status.className = "form__status is-err";
      }
    } else {
      // Formspree 연결 전: 이메일 앱으로 내용 넘김
      const subject = encodeURIComponent(`[Creative ON 문의] ${fd.get("type")} / ${fd.get("name")}`);
      location.href = `mailto:${mail}?subject=${subject}&body=${encodeURIComponent(body)}`;
      status.textContent = "메일 앱을 여는 중. 안 열리면 위 주소를 복사해 보내 주세요."; status.className = "form__status";
    }
  });

  /* ---------- misc ---------- */
  $("#year").textContent = new Date().getFullYear();
})();
