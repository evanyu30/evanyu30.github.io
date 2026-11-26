(() => {
  const C = window.PORTFOLIO;
  if (!C) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const slot = (name) => $(`[data-slot="${name}"]`);
  const fill = (name, text) => $$(`[data-slot="${name}"]`).forEach((el) => (el.textContent = text));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const page = document.body.dataset.page;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  const formatDate = (iso) => (iso ? dateFmt.format(new Date(`${iso}T12:00:00`)) : "");
  const readingTime = (item) => `${Math.max(1, Math.round(item.body.split(/\s+/).length / 220))} min read`;
  const plurals = { entry: "entries" };
  const count = (n, word) => `${n} ${n === 1 ? word : plurals[word] || `${word}s`}`;
  const byDateDesc = (a, b) => String(b.date).localeCompare(String(a.date));
  const tagList = (items, label) =>
    `<ul class="tags" aria-label="${label}">${items.map((t) => `<li class="tag">${esc(t)}</li>`).join("")}</ul>`;
  const addJsonLd = (data) => {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  };
  const external = (url) => /^https?:/.test(url);
  const extAttrs = (url) => (external(url) ? ' target="_blank" rel="noopener noreferrer"' : "");
  const socialLinks = [
    ["GitHub", C.links.github, "ph-github-logo"],
    ["LinkedIn", C.links.linkedin, "ph-linkedin-logo"],
    ["X", C.links.x, "ph-x-logo"],
    ["Hack The Box", C.links.hackthebox, "ph-cube"],
    ["TryHackMe", C.links.tryhackme, "ph-flag"],
  ].filter(([, url]) => url);

  /* ---------- Shell: nav and footer ---------- */
  const navItems = [
    ["writeups", "Writeups", "writeups.html"],
    ["research", "Research", "research.html"],
    ["projects", "Projects", "projects.html"],
    ["blog", "Blog", "blog.html"],
    ["contact", "Contact", "contact.html"],
  ];
  const parentOf = { writeup: "writeups", report: "research", project: "projects", post: "blog" };
  const current = parentOf[page] || page;
  const cur = (key) => (key === current ? ' aria-current="page"' : "");

  $(".skip-link").insertAdjacentHTML(
    "afterend",
    `<header class="nav-wrap">
      <div class="container nav-inner">
        <a class="brand" href="index.html">
          <span class="sr-only">${esc(C.name)}, home</span>
          <span class="brand-text" aria-hidden="true"><span class="brand-user">${esc(C.handle)}</span>@${esc(C.host)}<span class="brand-path">:~$</span><span class="cursor"></span></span>
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links">
          <span>Menu</span><i class="ph ph-list" aria-hidden="true"></i>
        </button>
        <nav class="nav" aria-label="Primary">
          <ul class="nav-links" id="nav-links">
            ${navItems.map(([k, label, href]) => `<li><a href="${href}"${cur(k)}>${label}</a></li>`).join("")}
          </ul>
        </nav>
      </div>
    </header>`
  );

  const header = $(".nav-wrap");
  const toggle = $(".nav-toggle");
  const setMenu = (open) => {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".ph").className = `ph ${open ? "ph-x" : "ph-list"}`;
    toggle.querySelector("span").textContent = open ? "Close" : "Menu";
  };
  toggle.addEventListener("click", () => setMenu(!header.classList.contains("is-open")));
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });
  addEventListener("scroll", () => header.classList.toggle("is-scrolled", scrollY > 8), { passive: true });

  $("main").insertAdjacentHTML(
    "afterend",
    `<footer class="footer">
      <div class="container footer-inner">
        <div class="footer-id">
          <p class="footer-name">${esc(C.name)} · ${new Date().getFullYear()}</p>
          <p class="footer-note">Plain HTML and Markdown. No analytics, no cookies.</p>
        </div>
        <ul class="footer-links">
          ${navItems.map(([, label, href]) => `<li><a href="${href}">${label}</a></li>`).join("")}
          ${socialLinks
            .map(([label, url, icon]) => `<li><a href="${esc(url)}"${extAttrs(url)}><i class="ph ${icon}" aria-hidden="true"></i>${label}</a></li>`)
            .join("")}
          <li><a href="/.well-known/security.txt"><i class="ph ph-shield-check" aria-hidden="true"></i>security.txt</a></li>
        </ul>
        <a class="back-top" href="#main"><i class="ph ph-arrow-up" aria-hidden="true"></i> Back to top</a>
      </div>
    </footer>`
  );

  /* ---------- Shared slots ---------- */
  $$('[data-slot="email-link"]').forEach((a) => {
    a.textContent = C.email;
    a.href = `mailto:${C.email}`;
  });

  /* ---------- Scroll reveal ---------- */
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealIO.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  // Called again after content loads, so new elements fade in too
  const reveal = (root = document) => $$(".reveal:not(.is-in)", root).forEach((el) => revealIO.observe(el));

  /* ---------- Markdown content ---------- */
  // Front matter: simple "key: value" lines, [a, b] lists, and one level of indented keys
  const parseValue = (raw) => {
    const v = raw.trim();
    if (v === "true" || v === "false") return v === "true";
    if (v.startsWith('"') && v.endsWith('"') && v.length > 1) {
      try {
        return JSON.parse(v);
      } catch {
        return v.slice(1, -1);
      }
    }
    if (v.startsWith("'") && v.endsWith("'") && v.length > 1) return v.slice(1, -1);
    if (v.startsWith("[") && v.endsWith("]")) return v.slice(1, -1).split(",").map(parseValue).filter((x) => x !== "");
    return v;
  };
  const parseFrontMatter = (text) => {
    const m = text.replace(/\r\n?/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m) return { data: {}, body: text.trim() };
    const data = {};
    let parent = null;
    for (const line of m[1].split("\n")) {
      if (!line.trim() || line.trim().startsWith("#")) continue;
      const colon = line.indexOf(":");
      if (colon < 0) continue;
      const key = line.slice(0, colon).trim();
      const value = line.slice(colon + 1);
      if (/^\s/.test(line) && parent) data[parent][key] = parseValue(value);
      else if (!value.trim()) data[(parent = key)] = {};
      else {
        data[key] = parseValue(value);
        parent = null;
      }
    }
    // A key left empty with nothing nested under it is just empty
    for (const k of Object.keys(data)) {
      if (data[k] && typeof data[k] === "object" && !Array.isArray(data[k]) && !Object.keys(data[k]).length) data[k] = "";
    }
    return { data, body: m[2].trim() };
  };

  const loadMarkdown = async (path) => {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
    const { data, body } = parseFrontMatter(await res.text());
    return { ...data, body, dir: path.slice(0, path.lastIndexOf("/") + 1) };
  };
  const toList = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  // A listed file that is missing is skipped with a console warning, not fatal
  const loadAll = (tasks) =>
    Promise.allSettled(tasks).then((results) =>
      results.flatMap((r) => {
        if (r.status === "fulfilled") return [r.value];
        console.warn(r.reason);
        return [];
      })
    );

  // Writeups, research, and blog posts share one shape: a folder of dated Markdown files
  const collections = {
    writeups: { dir: "writeups", list: C.writeups || [], article: "writeup.html" },
    research: { dir: "research", list: C.research || [], article: "report.html" },
    posts: { dir: "blog", list: C.posts || [], article: "post.html" },
  };
  const cache = {};
  const loadCollection = (key) =>
    (cache[key] ||= loadAll(
      collections[key].list.map(async (slug) => {
        const item = await loadMarkdown(`${collections[key].dir}/${slug}.md`);
        return { ...item, slug, tags: toList(item.tags) };
      })
    ).then((list) => list.sort(byDateDesc)));
  const articleHref = (key, item) => `${collections[key].article}?slug=${encodeURIComponent(item.slug)}`;

  const projectEntries = (C.projects || []).map((e) => (typeof e === "string" ? { slug: e } : e));
  const loadProject = async (entry) => {
    const p = await loadMarkdown(`projects/${entry.slug}/index.md`);
    return { ...p, slug: entry.slug, noteSlugs: entry.notes || entry.writeups || [], stack: toList(p.stack) };
  };
  const loadProjects = () => (cache.projects ||= loadAll(projectEntries.map(loadProject)));
  const loadNotes = (p) =>
    loadAll(p.noteSlugs.map(async (slug) => ({ ...(await loadMarkdown(`projects/${p.slug}/${slug}.md`)), slug }))).then((list) =>
      list.sort(byDateDesc)
    );
  const projectHref = (p) => `project.html?slug=${encodeURIComponent(p.slug)}`;
  const noteHref = (p, n) => `${projectHref(p)}&w=${encodeURIComponent(n.slug)}`;

  // Render Markdown into the article styles. Image and link paths are relative to the .md file.
  const slugify = (s) =>
    s
      .toLowerCase()
      .replace(/<[^>]+>/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "section";
  const renderMarkdown = (md, dir) => {
    const box = document.createElement("div");
    box.innerHTML = window.marked
      ? window.marked.parse(md, { gfm: true })
      : md
          .split(/\n{2,}/)
          .map((para) => `<p>${esc(para)}</p>`)
          .join("");
    const relative = (url) => url && !/^([a-z]+:|\/|#)/i.test(url);
    $$("img[src]", box).forEach((img) => {
      if (relative(img.getAttribute("src"))) img.setAttribute("src", dir + img.getAttribute("src"));
      img.loading = "lazy";
    });
    $$("a[href]", box).forEach((a) => {
      const href = a.getAttribute("href");
      if (relative(href) && !/\.html(\?|#|$)/.test(href)) a.setAttribute("href", dir + href);
      if (external(href)) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
    });
    // The page title is the only h1, so headings in the body start at h2
    $$("h1", box).forEach((h) => {
      const h2 = document.createElement("h2");
      h2.innerHTML = h.innerHTML;
      h.replaceWith(h2);
    });
    // Headings get anchors, so a contents list and shared links can point at them
    const used = new Set();
    const toc = [];
    $$("h2, h3", box).forEach((h) => {
      let id = slugify(h.textContent);
      for (let n = 2; used.has(id); n++) id = `${slugify(h.textContent)}-${n}`;
      used.add(id);
      h.id = id;
      if (h.tagName === "H2") toc.push({ id, text: h.textContent });
    });
    // Code blocks: syntax colors, a language label, and a copy button
    $$("pre > code", box).forEach((code) => {
      const lang = (code.className.match(/language-([\w+-]+)/) || [])[1] || "";
      if (window.hljs && lang && window.hljs.getLanguage(lang)) window.hljs.highlightElement(code);
      const pre = code.parentElement;
      const wrap = document.createElement("div");
      wrap.className = "code-block";
      wrap.innerHTML = `<div class="code-head"><span class="code-lang">${esc(lang || "text")}</span><button class="code-copy" type="button" data-action="copy-code"><i class="ph ph-copy" aria-hidden="true"></i><span>Copy</span></button></div>`;
      pre.replaceWith(wrap);
      wrap.appendChild(pre);
    });
    // Wide tables scroll inside their own box instead of the page
    $$("table", box).forEach((t) => {
      const wrap = document.createElement("div");
      wrap.className = "table-wrap";
      t.replaceWith(wrap);
      wrap.appendChild(t);
    });
    [...box.children].forEach((child, i) => {
      child.classList.add("reveal");
      child.style.setProperty("--delay", `${Math.min(i, 2) * 80}ms`);
    });
    return { html: box.innerHTML, toc };
  };

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest('[data-action="copy-code"]');
    if (!btn) return;
    const label = btn.querySelector("span");
    try {
      await navigator.clipboard.writeText(btn.closest(".code-block").querySelector("code").innerText);
      label.textContent = "Copied";
    } catch {
      label.textContent = "Select to copy";
    }
    setTimeout(() => (label.textContent = "Copy"), 2000);
  });

  /* ---------- Badges ---------- */
  const difficultyBadge = (d) => {
    if (!d) return "";
    const known = ["easy", "medium", "hard", "insane"];
    const k = String(d).toLowerCase();
    return `<span class="badge diff-${known.includes(k) ? k : "other"}">${esc(d)}</span>`;
  };
  const statusBadge = (s) => {
    if (!s) return "";
    const k = String(s).toLowerCase();
    const tone = /ongoing|in progress|active|draft/.test(k) ? "live" : /complete|published|done|accepted/.test(k) ? "done" : "other";
    return `<span class="status status-${tone}"><span class="status-dot" aria-hidden="true"></span>${esc(s)}</span>`;
  };
  const join = (...parts) => parts.filter(Boolean).map(esc).join(' <span aria-hidden="true">·</span> ');

  /* ---------- Shared pieces ---------- */
  const linkButtons = (links, defs) =>
    defs
      .filter(([k]) => links && links[k])
      .map(
        ([k, label, icon]) =>
          `<a class="btn btn-sm btn-ghost" href="${esc(links[k])}"${extAttrs(links[k])}><i class="ph ${icon}" aria-hidden="true"></i>${label}</a>`
      )
      .join("");
  const projectLinkDefs = [
    ["source", "Source code", "ph-github-logo"],
    ["demo", "Live demo", "ph-arrow-up-right"],
  ];
  const researchLinkDefs = [
    ["paper", "Paper", "ph-file-text"],
    ["code", "Code", "ph-github-logo"],
    ["data", "Data", "ph-download-simple"],
    ["slides", "Slides", "ph-arrow-up-right"],
  ];

  const cardDelay = (i) => `style="--delay:${(i % 2) * 120}ms"`;

  const projectCard = (p, i, heading = "h3") => `<a class="card project-card reveal" href="${projectHref(p)}" data-index="${i}" ${cardDelay(i)}>
    <p class="card-meta">${join(p.year, p.category)}</p>
    <${heading} class="card-title">${esc(p.title)}</${heading}>
    <p class="card-summary">${esc(p.summary || "")}</p>
    ${p.outcome ? `<p class="card-outcome"><strong>${esc(p.outcome.value)}</strong>${esc(p.outcome.label)}</p>` : ""}
    <div class="card-foot">
      <span class="card-stack">${p.stack.map(esc).join(" · ")}</span>
      <span class="card-more">Open project<i class="ph ph-arrow-right" aria-hidden="true"></i></span>
    </div>
  </a>`;

  const researchCard = (r, i, heading = "h3") => `<a class="card research-card reveal" href="${articleHref("research", r)}" data-index="${i}" ${cardDelay(i)}>
    <p class="card-meta">${statusBadge(r.status)}<span>${esc(r.area || "")}</span></p>
    <${heading} class="card-title">${esc(r.title)}</${heading}>
    <p class="card-summary">${esc(r.excerpt || "")}</p>
    <div class="card-foot">
      <time class="card-stack" datetime="${esc(r.date)}">${formatDate(r.date)}</time>
      <span class="card-more">Read the report<i class="ph ph-arrow-right" aria-hidden="true"></i></span>
    </div>
  </a>`;

  // A row in a list of articles: writeups, blog posts, and project notes
  const entryRow = (item, i, { href, heading = "h3", kicker = "", badge = "" }) => `<li class="reveal" data-index="${i}" style="--delay:${Math.min(i, 3) * 80}ms">
    <a class="entry-row" href="${href}">
      <div class="entry-side">
        <time class="entry-date" datetime="${esc(item.date)}">${formatDate(item.date)}</time>
        ${badge}
      </div>
      <div class="entry-info">
        ${kicker ? `<p class="entry-kicker">${kicker}</p>` : ""}
        <${heading} class="entry-title">${esc(item.title)}</${heading}>
        ${item.excerpt ? `<p class="entry-excerpt">${esc(item.excerpt)}</p>` : ""}
        <div class="entry-meta"><span>${readingTime(item)}</span>${item.tags && item.tags.length ? tagList(item.tags, "Topics") : ""}</div>
      </div>
      <i class="ph ph-arrow-right entry-arrow" aria-hidden="true"></i>
    </a>
  </li>`;
  const writeupRow = (w, i, heading) =>
    entryRow(w, i, { href: articleHref("writeups", w), heading, kicker: join(w.platform, w.category), badge: difficultyBadge(w.difficulty) });
  const postRow = (p, i, heading) => entryRow(p, i, { href: articleHref("posts", p), heading });

  const emptyState = (icon, title, text, action = "") => `<div class="empty reveal">
    <i class="ph ${icon}" aria-hidden="true"></i>
    <p class="empty-title">${esc(title)}</p>
    <p>${esc(text)}</p>
    ${action}
  </div>`;
  const loadErrorState = () =>
    emptyState(
      "ph-warning-circle",
      "This content failed to load.",
      location.protocol === "file:"
        ? "Browsers block Markdown files on pages opened straight from disk. Start the local server described in the README and open the site through it."
        : "The Markdown file is missing or not listed in content.js. Check both, then refresh."
    );
  const backButton = (href, label) =>
    `<a class="btn btn-primary" href="${href}"><i class="ph ph-arrow-left" aria-hidden="true"></i>${esc(label)}</a>`;

  // Filter chips plus an optional search box that show and hide list items
  const setupFilter = ({ chipsEl, statusEl, searchEl, listEl, items, keysOf, textOf, noun }) => {
    const counts = new Map();
    items.forEach((it) => keysOf(it).forEach((k) => counts.set(k, (counts.get(k) || 0) + 1)));
    const keys = ["All", ...counts.keys()];
    chipsEl.innerHTML = keys
      .map(
        (k) =>
          `<button class="chip" type="button" data-key="${esc(k)}" aria-pressed="false">${esc(k)}<span class="count">${
            k === "All" ? items.length : counts.get(k)
          }</span></button>`
      )
      .join("");
    // One category is not a choice, so hide the chips
    chipsEl.hidden = keys.length < 3;
    // Nothing to filter or search, so drop the whole bar
    chipsEl.closest(".filter-bar").hidden = chipsEl.hidden && !searchEl;
    const nodes = $$("[data-index]", listEl);
    const haystack = items.map((it) => (textOf ? textOf(it) : "").toLowerCase());
    const state = { key: "All", q: "" };
    const apply = () => {
      let shown = 0;
      nodes.forEach((n) => {
        const i = n.dataset.index;
        const match = (state.key === "All" || keysOf(items[i]).includes(state.key)) && (!state.q || haystack[i].includes(state.q));
        n.hidden = !match;
        if (match) shown++;
      });
      statusEl.textContent = !shown
        ? "No matches. Try another keyword or category."
        : shown === items.length
          ? count(items.length, noun)
          : `Showing ${shown} of ${count(items.length, noun)}`;
      $$(".chip", chipsEl).forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.key === state.key)));
    };
    chipsEl.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      state.key = chip.dataset.key;
      apply();
    });
    if (searchEl) {
      searchEl.closest(".search").hidden = false;
      searchEl.addEventListener("input", () => {
        state.q = searchEl.value.trim().toLowerCase();
        apply();
      });
    }
    apply();
  };
  const searchText = (it) => [it.title, it.excerpt, it.platform, it.category, it.area, it.difficulty, ...(it.tags || [])].join(" ");

  /* ---------- Article view, shared by writeups, research, posts, and project notes ---------- */
  const setMeta = (title, description, type = "article") => {
    document.title = `${title} · ${C.name}`;
    $('meta[name="description"]').setAttribute("content", description);
    $("head").insertAdjacentHTML(
      "beforeend",
      `<meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(description)}" /><meta property="og:type" content="${type}" />`
    );
  };
  const articleNav = (newer, older, hrefOf) => {
    const link = (a, dir) =>
      a
        ? `<a class="${dir}" href="${hrefOf(a)}">
            <span class="post-nav-label">${dir === "newer" ? '<i class="ph ph-arrow-left" aria-hidden="true"></i> Newer' : 'Older <i class="ph ph-arrow-right" aria-hidden="true"></i>'}</span>
            <strong>${esc(a.title)}</strong>
          </a>`
        : "";
    return newer || older ? `<nav class="post-nav" aria-label="More to read">${link(newer, "newer")}${link(older, "older")}</nav>` : "";
  };
  const factList = (facts) => {
    const shown = facts.filter(([, v]) => v);
    return shown.length
      ? `<dl class="facts reveal" style="--delay:200ms">${shown.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("")}</dl>`
      : "";
  };
  const renderArticle = (el, { back, kicker = "", item, facts = "", before = "", after = "", navHtml = "" }) => {
    const { html, toc } = renderMarkdown(item.body, item.dir);
    el.innerHTML = `
      <a class="back-link reveal" href="${back.href}"><i class="ph ph-arrow-left" aria-hidden="true"></i> ${esc(back.label)}</a>
      <header class="article-head">
        <p class="article-meta reveal" style="--delay:80ms">
          ${kicker ? `<span class="article-kicker">${esc(kicker)}</span><span aria-hidden="true">·</span>` : ""}<time datetime="${esc(item.date)}">${formatDate(item.date)}</time><span aria-hidden="true">·</span><span>${readingTime(item)}</span>
        </p>
        <h1 class="article-title reveal" style="--delay:120ms">${esc(item.title)}</h1>
        ${item.excerpt ? `<p class="hero-sub reveal" style="--delay:160ms">${esc(item.excerpt)}</p>` : ""}
        ${facts}
        ${item.tags && item.tags.length ? `<div class="reveal" style="--delay:240ms">${tagList(item.tags, "Topics")}</div>` : ""}
      </header>
      ${before}
      ${
        toc.length >= 3
          ? `<nav class="toc reveal" aria-label="Contents"><p class="toc-label">Contents</p><ol>${toc
              .map((t) => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`)
              .join("")}</ol></nav>`
          : ""
      }
      <div class="prose">${html}</div>
      ${after}
      ${navHtml}`;
  };
  const notFound = (el, what, text, href, label) => {
    document.title = `${what} not found · ${C.name}`;
    el.innerHTML = emptyState("ph-file-x", `${what} not found.`, text, backButton(href, label));
  };
  const articleLd = (type, item) =>
    addJsonLd({
      "@context": "https://schema.org",
      "@type": type,
      headline: item.title,
      description: item.excerpt || "",
      datePublished: item.date,
      author: { "@type": "Person", name: C.name, url: C.url },
    });

  // A collection article: find it, render it, link its neighbors
  const collectionArticle = async (key, { what, listHref, listLabel, kicker, facts, before, ldType = "TechArticle" }) => {
    const el = slot("article");
    const slugParam = new URLSearchParams(location.search).get("slug");
    if (!collections[key].list.includes(slugParam)) {
      notFound(el, what, "It may have been renamed or removed. Everything still published is listed on the index page.", listHref, listLabel);
      return;
    }
    const items = await loadCollection(key);
    const idx = items.findIndex((p) => p.slug === slugParam);
    if (idx < 0) throw new Error(`Could not load ${collections[key].dir}/${slugParam}.md`);
    const item = items[idx];
    setMeta(item.title, item.excerpt || "");
    renderArticle(el, {
      back: { href: listHref, label: listLabel },
      kicker,
      item,
      facts: facts ? facts(item) : "",
      before: before ? before(item) : "",
      navHtml: articleNav(items[idx - 1], items[idx + 1], (x) => articleHref(key, x)),
    });
    articleLd(ldType, item);
  };

  /* ---------- Pages ---------- */
  const pages = {
    async home() {
      fill("hero-eyebrow", C.hero.eyebrow);
      fill("subheadline", C.hero.subheadline);
      fill("terminal-caption", C.hero.terminalCaption || "");
      const heroActions = slot("hero-actions");
      heroActions.innerHTML = `<a class="btn btn-primary" href="${esc(C.hero.primary.href)}">${esc(C.hero.primary.label)}<i class="ph ph-arrow-right" aria-hidden="true"></i></a>
        <a class="btn btn-ghost" href="${esc(C.hero.secondary.href)}">${esc(C.hero.secondary.label)}</a>`;
      scrambleHeadline(slot("headline"), C.hero.headline);

      // Scope: the three areas, with live counts filled in once files load
      fill("scope-eyebrow", C.scope.eyebrow);
      fill("scope-title", C.scope.title);
      fill("scope-sub", C.scope.sub);
      slot("scope").innerHTML = C.scope.items
        .map(
          (s, i) => `<li class="reveal" style="--delay:${i * 100}ms"><a class="card scope-card" href="${esc(s.href)}">
            <p class="card-meta"><span class="scope-index">0${i + 1}</span><span>${esc(s.tag)}</span></p>
            <h3 class="card-title">${esc(s.title)}</h3>
            <p class="card-summary">${esc(s.text)}</p>
            <div class="card-foot"><span class="card-stack" data-count="${esc(s.key)}">&nbsp;</span><span class="card-more">Open<i class="ph ph-arrow-right" aria-hidden="true"></i></span></div>
          </a></li>`
        )
        .join("");
      initTagline();
      addJsonLd({
        "@context": "https://schema.org",
        "@type": "Person",
        name: C.name,
        jobTitle: C.role,
        email: `mailto:${C.email}`,
        url: C.url,
        sameAs: socialLinks.map(([, url]) => url),
      });
      reveal();

      const sectionOf = (name) => $(`[data-section="${name}"]`);
      const show = (name, html) => {
        const sec = sectionOf(name);
        sec.hidden = !html;
        if (html) slot(`latest-${name}`).innerHTML = html;
      };
      const settle = (p, fn) =>
        p.then(fn).catch((err) => {
          console.error(err);
          return [];
        });
      const [writeups, research, projects, posts] = await Promise.all([
        settle(loadCollection("writeups"), (list) => (show("writeups", list.slice(0, 3).map((w, i) => writeupRow(w, i)).join("")), list)),
        settle(loadCollection("research"), (list) => (show("research", list.slice(0, 2).map((r, i) => researchCard(r, i)).join("")), list)),
        settle(loadProjects(), (list) => {
          const featured = list.filter((p) => p.featured);
          show("projects", (featured.length ? featured : list).slice(0, 2).map((p, i) => projectCard(p, i)).join(""));
          return list;
        }),
        settle(loadCollection("posts"), (list) => (show("posts", list.slice(0, 3).map((p, i) => postRow(p, i)).join("")), list)),
      ]);
      const totals = { writeups: writeups.length, research: research.length, projects: projects.length, posts: posts.length };
      $$("[data-count]").forEach((el) => {
        const n = totals[el.dataset.count];
        const noun = { writeups: "writeup", research: "entry", projects: "project" }[el.dataset.count];
        el.textContent = n ? `${count(n, noun)} published` : "Coming soon";
      });
      // Number the sections that made it onto the page: 01, 02, 03
      $$("[data-section]:not([hidden]) .sec-num").forEach((el, i) => (el.textContent = String(i + 1).padStart(2, "0")));
      const recent = [
        ...writeups.map((x) => ({ ...x, kind: "writeup" })),
        ...research.map((x) => ({ ...x, kind: "research" })),
        ...posts.map((x) => ({ ...x, kind: "blog" })),
      ].sort(byDateDesc);
      terminalCounts({ totals, recent });
    },

    async writeups() {
      const listEl = slot("writeup-list");
      const items = await loadCollection("writeups");
      if (!items.length) {
        listEl.innerHTML = `<li>${emptyState(
          "ph-flag",
          "No writeups published yet.",
          "The first ones are on the way. Only retired machines and finished competitions are covered, so nothing here spoils a live challenge."
        )}</li>`;
        slot("writeup-filters").hidden = true;
        return;
      }
      listEl.innerHTML = items.map((w, i) => writeupRow(w, i, "h2")).join("");
      setupFilter({
        chipsEl: slot("writeup-filters"),
        statusEl: slot("writeup-status"),
        searchEl: slot("writeup-search"),
        listEl,
        items,
        keysOf: (w) => [w.category || "Other"],
        textOf: searchText,
        noun: "writeup",
      });
    },

    async research() {
      const listEl = slot("research-list");
      const [items, posts] = await Promise.all([loadCollection("research"), loadCollection("posts")]);
      if (items.length) {
        listEl.innerHTML = items.map((r, i) => researchCard(r, i, "h2")).join("");
        setupFilter({
          chipsEl: slot("research-filters"),
          statusEl: slot("research-status"),
          listEl,
          items,
          keysOf: (r) => [r.area || "General"],
          noun: "entry",
        });
      } else {
        listEl.innerHTML = emptyState(
          "ph-flask",
          "The first report is still in the lab.",
          "Reports are published once the experiments are done and the results hold up. In the meantime, the notes below show where the work is heading."
        );
        slot("research-filters").hidden = true;
      }
      const tags = (C.researchTags || []).map((t) => t.toLowerCase());
      const related = posts.filter((p) => p.tags.some((t) => tags.includes(t.toLowerCase())));
      const relatedSec = slot("research-related");
      relatedSec.hidden = !related.length;
      if (related.length) slot("related-list").innerHTML = related.map((p, i) => postRow(p, i, "h3")).join("");
    },

    async projects() {
      const listEl = slot("project-list");
      const projects = await loadProjects();
      if (!projects.length) {
        listEl.innerHTML = emptyState(
          "ph-wrench",
          "No projects published yet.",
          "The first tools are still on the workbench. Each one will ship with its source code and a breakdown of how it works."
        );
        slot("project-filters").hidden = true;
        return;
      }
      listEl.innerHTML = projects.map((p, i) => projectCard(p, i, "h2")).join("");
      setupFilter({
        chipsEl: slot("project-filters"),
        statusEl: slot("project-status"),
        listEl,
        items: projects,
        keysOf: (p) => [p.category || "Other"],
        noun: "project",
      });
    },

    async blog() {
      const listEl = slot("post-list");
      const posts = await loadCollection("posts");
      if (!posts.length) {
        listEl.innerHTML = `<li>${emptyState("ph-file-text", "No posts yet.", "The first one is in draft, so check back soon.")}</li>`;
        slot("post-filters").hidden = true;
        return;
      }
      listEl.innerHTML = posts.map((p, i) => postRow(p, i, "h2")).join("");
      setupFilter({
        chipsEl: slot("post-filters"),
        statusEl: slot("post-status"),
        listEl,
        items: posts,
        keysOf: (p) => p.tags,
        noun: "post",
      });
    },

    writeup: () =>
      collectionArticle("writeups", {
        what: "Writeup",
        listHref: "writeups.html",
        listLabel: "All writeups",
        kicker: "Writeup",
        facts: (w) =>
          factList([
            ["Platform", esc(w.platform || "")],
            ["Category", esc(w.category || "")],
            ["Difficulty", difficultyBadge(w.difficulty)],
            ["Target", esc(w.os || "")],
          ]),
        before: () =>
          `<p class="notice reveal"><i class="ph ph-warning" aria-hidden="true"></i><span><strong>Spoilers ahead.</strong> This is the full solution. If you're still working on it, come back once you have the flag.</span></p>`,
      }),

    report: () =>
      collectionArticle("research", {
        what: "Research entry",
        listHref: "research.html",
        listLabel: "All research",
        kicker: "Research",
        facts: (r) => {
          const links = linkButtons(r.links, researchLinkDefs);
          return (
            factList([
              ["Status", statusBadge(r.status)],
              ["Area", esc(r.area || "")],
            ]) + (links ? `<div class="project-actions reveal" style="--delay:240ms">${links}</div>` : "")
          );
        },
        ldType: "ScholarlyArticle",
      }),

    post: () =>
      collectionArticle("posts", { what: "Post", listHref: "blog.html", listLabel: "Back to the blog", ldType: "BlogPosting" }),

    async project() {
      const el = slot("article");
      const params = new URLSearchParams(location.search);
      const entry = projectEntries.find((x) => x.slug === params.get("slug"));
      if (!entry) {
        notFound(el, "Project", "It may have been renamed or removed. Every published project is listed on the projects page.", "projects.html", "All projects");
        return;
      }

      const p = await loadProject(entry);
      const notes = await loadNotes(p);
      const nSlug = params.get("w");

      // One build note, read inside its project
      if (nSlug) {
        const idx = notes.findIndex((n) => n.slug === nSlug);
        if (idx < 0) {
          notFound(el, "Note", `It may have been renamed or removed. Every note for ${p.title} is listed on its project page.`, projectHref(p), p.title);
          return;
        }
        const n = notes[idx];
        setMeta(`${n.title} · ${p.title}`, n.excerpt || "");
        renderArticle(el, {
          back: { href: projectHref(p), label: p.title },
          kicker: "Build note",
          item: n,
          navHtml: articleNav(notes[idx - 1], notes[idx + 1], (x) => noteHref(p, x)),
        });
        return;
      }

      // Project overview, then its build notes
      setMeta(p.title, p.summary || "", "website");
      const links = linkButtons(p.links, projectLinkDefs);
      const { html } = p.body ? renderMarkdown(p.body, p.dir) : { html: "" };
      el.innerHTML = `
        <a class="back-link reveal" href="projects.html"><i class="ph ph-arrow-left" aria-hidden="true"></i> All projects</a>
        <header class="article-head">
          <p class="article-meta reveal" style="--delay:80ms">${join(p.year, p.category)}</p>
          <h1 class="article-title reveal" style="--delay:120ms">${esc(p.title)}</h1>
          ${p.summary ? `<p class="hero-sub reveal" style="--delay:160ms">${esc(p.summary)}</p>` : ""}
          ${links ? `<div class="project-actions reveal" style="--delay:200ms">${links}</div>` : ""}
          ${factList([
            ["Outcome", p.outcome ? `<strong>${esc(p.outcome.value)}</strong> ${esc(p.outcome.label)}` : ""],
            ["Stack", p.stack.map(esc).join(" · ")],
          ])}
        </header>
        ${
          html
            ? `<section class="project-section" aria-labelledby="overview-title">
                <h2 class="project-section-title reveal" id="overview-title">How it works</h2>
                <div class="prose">${html}</div>
              </section>`
            : ""
        }
        <section class="project-section" aria-labelledby="notes-title">
          <h2 class="project-section-title reveal" id="notes-title">Build notes <span class="section-count">${notes.length}</span></h2>
          ${
            notes.length
              ? `<ul class="entry-list">${notes.map((n, i) => entryRow(n, i, { href: noteHref(p, n) })).join("")}</ul>`
              : `<p class="project-empty reveal">No build notes yet. Design decisions and lessons learned will be collected here.</p>`
          }
        </section>`;
    },

    contact() {
      fill("contact-eyebrow", C.contact.eyebrow);
      fill("contact-intro", C.contact.intro);
      fill("contact-submit", C.contact.submit);
      fill("contact-disclosure", C.contact.disclosure);
      slot("contact-headline").innerHTML = C.contact.headline.map((l) => `<span class="line">${esc(l)}</span>`).join("");
      slot("contact-topics").innerHTML = C.contact.topics
        .map(
          (t, i) =>
            `<label class="topic"><input type="radio" name="topic" value="${esc(t)}"${i === 0 ? " checked" : ""} /><span>${esc(t)}</span></label>`
        )
        .join("");
      const social = slot("social");
      if (socialLinks.length) {
        social.innerHTML = socialLinks
          .map(
            ([label, url, icon]) =>
              `<li><a class="btn btn-sm btn-ghost" href="${esc(url)}"${extAttrs(url)}><i class="ph ${icon}" aria-hidden="true"></i>${label}</a></li>`
          )
          .join("");
      } else {
        social.hidden = true;
      }
      initForm();
    },
  };

  /* ---------- Behaviours ---------- */
  // The headline resolves from noise into text, like a decrypt. Screen readers get the plain text.
  function scrambleHeadline(el, lines) {
    el.innerHTML = `<span class="sr-only">${esc(lines.join(" "))}</span><span class="scramble" aria-hidden="true">${lines
      .map((l) => `<span class="line">${esc(l)}</span>`)
      .join("")}</span>`;
    const spans = $$(".scramble .line", el);
    const addCursor = () => spans[spans.length - 1].insertAdjacentHTML("beforeend", '<span class="cursor"></span>');
    if (reducedMotion) return addCursor();
    const glyphs = "!<>_/\\[]{}=+*^?#$%&01";
    const total = lines.join("").length;
    const dur = 1200;
    const start = performance.now();
    let frame = 0;
    const tick = (now) => {
      const p = (now - start) / dur;
      let offset = 0;
      if (frame++ % 2 === 0) {
        spans.forEach((span, li) => {
          const text = lines[li];
          span.textContent = [...text]
            .map((ch, k) => {
              if (ch === " ") return " ";
              const at = (offset + k) / total;
              return p > at * 0.7 + 0.3 ? ch : glyphs[(Math.random() * glyphs.length) | 0];
            })
            .join("");
          offset += text.length;
        });
      }
      if (p < 1) requestAnimationFrame(tick);
      else {
        spans.forEach((span, li) => (span.textContent = lines[li]));
        addCursor();
      }
    };
    requestAnimationFrame(tick);
  }

  // The terminal types its commands once; the directory listing waits for the real counts
  let resolveCounts;
  const countsReady = new Promise((r) => (resolveCounts = r));
  const terminalCounts = (totals) => resolveCounts(totals);
  (function initTerminal() {
    const body = slot("terminal");
    if (!body) return;
    const prompt = `<span class="t-prompt"><span class="t-user">${esc(C.handle)}@${esc(C.host)}</span>:<span class="t-path">~</span>$ </span>`;
    const listing = (t) =>
      [
        ["writeups", t.writeups, "writeup"],
        ["research", t.research, "entry"],
        ["projects", t.projects, "project"],
        ["blog", t.posts, "post"],
      ].map(
        ([dir, n, noun]) =>
          `<span class="t-dim">drwxr-xr-x</span>  <span class="t-dir">${dir}/</span>${" ".repeat(10 - dir.length)}<span class="t-dim">${count(n, noun)}</span>`
      );
    const short = (t, n = 34) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);
    const recent = (items, n) =>
      items.length
        ? items.slice(0, n).map((x) => `<span class="t-dim">${esc(x.date)}</span>  <span class="t-dir">${x.kind.padEnd(8)}</span>  ${esc(short(x.title))}`)
        : ['<span class="t-dim">changelog is empty, first entries coming soon</span>'];
    const outputs = async (step) => {
      if (step.listing) return listing((await countsReady).totals);
      if (step.recent) return recent((await countsReady).recent, step.recent);
      return (step.out || []).map((l) =>
        step.ok ? esc(l).replace(/^\[\+\]/, '<span class="t-ok">[+]</span>') : esc(l)
      );
    };
    const steps = C.hero.terminal || [];
    const line = (html, cls = "") => {
      const div = document.createElement("div");
      div.className = `t-line ${cls}`;
      div.innerHTML = html;
      body.appendChild(div);
      return div;
    };
    const run = async () => {
      if (reducedMotion) {
        for (const step of steps) {
          line(`${prompt}<span class="t-cmd">${esc(step.cmd)}</span>`);
          (await outputs(step)).forEach((o) => line(o, "t-out"));
        }
        line(`${prompt}<span class="cursor"></span>`);
        return;
      }
      await wait(500);
      for (const step of steps) {
        const l = line(`${prompt}<span class="t-cmd"></span><span class="cursor"></span>`);
        const cmd = $(".t-cmd", l);
        for (const ch of step.cmd) {
          cmd.textContent += ch;
          await wait(45 + Math.random() * 55);
        }
        await wait(260);
        $(".cursor", l).remove();
        (await outputs(step)).forEach((o) => line(o, "t-out"));
        await wait(420);
      }
      line(`${prompt}<span class="cursor"></span>`);
    };
    run();
  })();

  // Tagline words light up one at a time as they cross a trigger line
  function initTagline() {
    const tagline = slot("tagline");
    tagline.innerHTML = C.tagline
      .split(/\s+/)
      .map((w) => `<span class="word">${esc(w)}</span>`)
      .join(" ");
    const words = $$(".word", tagline);
    if (reducedMotion) {
      words.forEach((w) => w.classList.add("on"));
      return;
    }
    let ticking = false;
    const paintWords = () => {
      ticking = false;
      const trigger = innerHeight * 0.62;
      words.forEach((w) => w.classList.toggle("on", w.getBoundingClientRect().top < trigger));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(paintWords);
    };
    // Only listen while the section is near the viewport
    new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) addEventListener("scroll", onScroll, { passive: true });
        else removeEventListener("scroll", onScroll);
        paintWords();
      },
      { rootMargin: "20% 0px" }
    ).observe(tagline);
  }

  function initForm() {
    const form = slot("form");
    const status = slot("form-status");
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const rules = {
      name: (v) => (v.trim() ? "" : "Please add your name."),
      email: (v) =>
        !v.trim() ? "Please add an email address for the reply." : emailRe.test(v.trim()) ? "" : "That address looks incomplete. Check it for a typo.",
      message: (v) =>
        !v.trim() ? "Please write a message." : v.trim().length < 20 ? "Please add a bit more detail, at least 20 characters." : "",
    };
    const validate = (field) => {
      const msg = rules[field.name](field.value);
      field.setAttribute("aria-invalid", msg ? "true" : "false");
      $(`#${field.id}-err`).textContent = msg;
      return !msg;
    };
    Object.keys(rules).forEach((name) => {
      const field = form.elements[name];
      field.addEventListener("blur", () => field.value && validate(field));
      field.addEventListener("input", () => field.getAttribute("aria-invalid") === "true" && validate(field));
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const invalid = Object.keys(rules)
        .map((n) => form.elements[n])
        .filter((f) => !validate(f));
      if (invalid.length) {
        invalid[0].focus();
        status.hidden = true;
        return;
      }
      const { name, email, topic, message } = form.elements;
      const subject = `[${topic.value}] from ${name.value.trim()}`;
      const body = `${message.value.trim()}\n\n${name.value.trim()}\n${email.value.trim()}`;
      location.href = `mailto:${C.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.innerHTML = `<i class="ph ph-check-circle" aria-hidden="true"></i>
        <p><strong>Your email app should open with the message ready to send.</strong>
        If it didn't, copy the message and send it to ${esc(C.email)}.</p>`;
      status.hidden = false;
    });
  }

  /* ---------- Copy email ---------- */
  $$('[data-action="copy-email"]').forEach((btn) => {
    let timer;
    btn.addEventListener("click", async () => {
      const statusEl = btn.closest("[data-copy-scope]")?.querySelector('[data-slot="copy-status"]');
      if (!statusEl) return;
      clearTimeout(timer);
      try {
        await navigator.clipboard.writeText(C.email);
        statusEl.textContent = "Copied to your clipboard.";
      } catch {
        statusEl.textContent = "Copy failed. Select the address and copy it manually.";
      }
      timer = setTimeout(() => (statusEl.textContent = ""), 2400);
    });
  });

  /* ---------- Decoration: hex dump of this page's own HTTP request ---------- */
  (function initHexdump() {
    const el = $("[data-hexdump]");
    if (!el) return;
    const host = new URL(C.url).host;
    const path = `/${location.pathname.split("/").pop() || "index.html"}`;
    const text =
      `GET ${path} HTTP/1.1\r\nHost: ${host}\r\nUser-Agent: Mozilla/5.0 (X11; Kali)\r\nAccept: text/html\r\nConnection: close\r\n\r\n` +
      `HTTP/1.1 200 OK\r\nServer: GitHub.com\r\nContent-Type: text/html; charset=utf-8\r\nCache-Control: max-age=600\r\n\r\n<!doctype html>`;
    const hits = new Set();
    [path, "200 OK"].forEach((h) => {
      const i = text.indexOf(h);
      if (i >= 0) for (let k = 0; k < h.length; k++) hits.add(i + k);
    });
    const rows = [];
    for (let off = 0; off < Math.min(text.length, 20 * 16); off += 16) {
      let hex = "";
      let asc = "";
      for (let k = 0; k < 16; k++) {
        const has = off + k < text.length;
        const code = text.charCodeAt(off + k);
        const cell = has ? code.toString(16).padStart(2, "0") : "  ";
        const ch = has ? (code >= 32 && code < 127 ? esc(text[off + k]) : ".") : " ";
        const hit = hits.has(off + k);
        hex += (hit ? `<span class="hd-hit">${cell}</span>` : cell) + (k % 2 ? " " : "");
        asc += hit ? `<span class="hd-hit">${ch}</span>` : ch;
      }
      rows.push(`<span class="hd-off">${off.toString(16).padStart(8, "0")}:</span> ${hex} ${asc}`);
    }
    el.innerHTML = rows.join("\n");
  })();

  /* ---------- Decoration: a network map where an intrusion spreads host to host ---------- */
  (function initNetmap() {
    const canvas = $("[data-netmap]");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const names = ["DC01", "WEB01", "SQL02", "FS01", "JUMP", "VPN", "MAIL", "DEV03", "BACKUP", "CI", "WS-114", "PRINT"];
    const RED = "255, 66, 88";
    const DIM = "236, 236, 238";
    let W = 0, H = 0, nodes = [], edges = [], adj = [], state, raf = 0, visible = true;

    const build = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Hosts on a jittered grid, so they spread evenly without clumping
      const n = Math.max(14, Math.min(56, Math.round((W * H) / 22000)));
      const cols = Math.max(3, Math.round(Math.sqrt((n * W) / H)));
      const rows = Math.ceil(n / cols);
      nodes = [];
      for (let i = 0; i < cols * rows; i++) {
        const cx = (i % cols) + 0.15 + Math.random() * 0.7;
        const cy = Math.floor(i / cols) + 0.15 + Math.random() * 0.7;
        nodes.push({ x: (cx / cols) * W, y: (cy / rows) * H, label: "" });
      }
      // About one host in four gets a name or an address
      let ni = 0;
      nodes.forEach((nd) => {
        if (Math.random() < 0.25) nd.label = ni < names.length && Math.random() < 0.6 ? names[ni++] : `10.10.11.${(Math.random() * 250 + 2) | 0}`;
      });
      // Link each host to its two nearest neighbors
      const seen = new Set();
      edges = [];
      adj = nodes.map(() => []);
      nodes.forEach((a, i) => {
        nodes
          .map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
          .filter((o) => o.j !== i)
          .sort((p, q) => p.d - q.d)
          .slice(0, 2)
          .forEach(({ j, d }) => {
            const key = i < j ? `${i}-${j}` : `${j}-${i}`;
            if (seen.has(key)) return;
            seen.add(key);
            edges.push({ a: i, b: j, d });
            adj[i].push({ to: j, d });
            adj[j].push({ to: i, d });
          });
      });
      reset(performance.now());
    };

    // The intrusion starts on a host right of center, where the map is most visible
    const reset = (now) => {
      const candidates = nodes.map((nd, i) => i).filter((i) => nodes[i].x > W * 0.45 && nodes[i].x < W * 0.8);
      const entry = candidates.length ? candidates[(Math.random() * candidates.length) | 0] : 0;
      state = { entry, owned: new Map([[entry, now]]), packets: [], pulses: [{ node: entry, start: now }], next: now + 900, phase: "run", until: 0, fade: 1 };
    };

    const frontier = () => {
      const busy = new Set(state.packets.map((p) => p.to));
      const out = [];
      state.owned.forEach((_, i) => adj[i].forEach((e) => !state.owned.has(e.to) && !busy.has(e.to) && out.push({ from: i, ...e })));
      return out;
    };

    const step = (now) => {
      if (state.phase === "run") {
        if (now >= state.next) {
          const f = frontier();
          if (f.length) {
            const e = f[(Math.random() * f.length) | 0];
            state.packets.push({ from: e.from, to: e.to, start: now, dur: 500 + e.d * 2.2 });
          }
          state.next = now + 450 + Math.random() * 650;
        }
        state.packets = state.packets.filter((p) => {
          if (now - p.start < p.dur) return true;
          state.owned.set(p.to, now);
          state.pulses.push({ node: p.to, start: now });
          return false;
        });
        if (state.owned.size >= nodes.length * 0.5 || (!state.packets.length && !frontier().length)) {
          state.phase = "hold";
          state.until = now + 2800;
        }
      } else if (state.phase === "hold" && now >= state.until) {
        state.phase = "fade";
        state.until = now + 1200;
      } else if (state.phase === "fade") {
        state.fade = Math.max(0, (state.until - now) / 1200);
        if (now >= state.until) reset(now);
      }
      state.pulses = state.pulses.filter((p) => now - p.start < 1100);
    };

    const draw = (now) => {
      const f = state.fade;
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      edges.forEach(({ a, b }) => {
        const hot = state.owned.has(a) && state.owned.has(b);
        ctx.strokeStyle = hot ? `rgba(${RED}, ${0.32 * f})` : `rgba(${DIM}, 0.07)`;
        ctx.beginPath();
        ctx.moveTo(nodes[a].x, nodes[a].y);
        ctx.lineTo(nodes[b].x, nodes[b].y);
        ctx.stroke();
      });
      // Packets in flight, with a bright head and a trail back to the source
      state.packets.forEach((p) => {
        const t = Math.min(1, (now - p.start) / p.dur);
        const A = nodes[p.from];
        const B = nodes[p.to];
        const x = A.x + (B.x - A.x) * t;
        const y = A.y + (B.y - A.y) * t;
        ctx.strokeStyle = `rgba(${RED}, 0.7)`;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = `rgb(${RED})`;
        ctx.shadowColor = `rgb(${RED})`;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      state.pulses.forEach((p) => {
        const t = (now - p.start) / 1100;
        const nd = nodes[p.node];
        ctx.strokeStyle = `rgba(${RED}, ${(1 - t) * 0.8 * f})`;
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, 4 + t * 20, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.font = "10px 'Geist Mono', ui-monospace, monospace";
      nodes.forEach((nd, i) => {
        const own = state.owned.has(i);
        if (own) {
          ctx.fillStyle = `rgba(${RED}, ${f})`;
          ctx.shadowColor = `rgb(${RED})`;
          ctx.shadowBlur = 8 * f;
          ctx.fillRect(nd.x - 2.5, nd.y - 2.5, 5, 5);
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = `rgba(${DIM}, 0.3)`;
          ctx.fillRect(nd.x - 1.5, nd.y - 1.5, 3, 3);
        }
        if (i === state.entry) {
          // Crosshair on the initial foothold
          ctx.strokeStyle = `rgba(${RED}, ${0.6 * f})`;
          ctx.beginPath();
          ctx.moveTo(nd.x - 12, nd.y); ctx.lineTo(nd.x - 6, nd.y);
          ctx.moveTo(nd.x + 6, nd.y); ctx.lineTo(nd.x + 12, nd.y);
          ctx.moveTo(nd.x, nd.y - 12); ctx.lineTo(nd.x, nd.y - 6);
          ctx.moveTo(nd.x, nd.y + 6); ctx.lineTo(nd.x, nd.y + 12);
          ctx.stroke();
        }
        if (nd.label) {
          ctx.fillStyle = own ? `rgba(${RED}, ${0.85 * f})` : `rgba(${DIM}, 0.22)`;
          // Labels near the right edge go on the left of the host, so they never clip
          const right = nd.x + 8 + ctx.measureText(nd.label).width < W - 4;
          ctx.textAlign = right ? "left" : "right";
          ctx.fillText(nd.label, right ? nd.x + 8 : nd.x - 8, nd.y + 3);
        }
      });
    };

    const loop = (now) => {
      step(now);
      draw(now);
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const start = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };

    // With reduced motion, show one still frame of an intrusion part way through
    const still = () => {
      const now = performance.now();
      reset(now);
      const queue = [state.entry];
      while (queue.length && state.owned.size < nodes.length * 0.35) {
        const i = queue.shift();
        adj[i].forEach((e) => {
          if (!state.owned.has(e.to)) {
            state.owned.set(e.to, now);
            queue.push(e.to);
          }
        });
      }
      state.pulses = [];
      draw(now);
    };

    build();
    if (reducedMotion) {
      still();
      new ResizeObserver(() => (build(), still())).observe(canvas);
      return;
    }
    // Rebuild only on real size changes, not on every small layout shift
    let last = { w: W, h: H };
    new ResizeObserver(() => {
      const r = canvas.getBoundingClientRect();
      if (Math.abs(r.width - last.w) < 40 && Math.abs(r.height - last.h) < 80) return;
      build();
      last = { w: W, h: H };
    }).observe(canvas);
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      start();
    }).observe(canvas);
    document.addEventListener("visibilitychange", start);
    start();
  })();

  // Static parts fade in right away; loaded content fades in once it arrives.
  // A loading or rendering error shows a message instead of leaving the page blank.
  reveal();
  const mainSlot = {
    writeups: "writeup-list",
    research: "research-list",
    projects: "project-list",
    blog: "post-list",
    writeup: "article",
    report: "article",
    post: "article",
    project: "article",
  }[page];
  Promise.resolve()
    .then(() => pages[page] && pages[page]())
    .catch((err) => {
      console.error(err);
      const el = mainSlot && slot(mainSlot);
      if (el) el.innerHTML = el.tagName === "UL" ? `<li>${loadErrorState()}</li>` : loadErrorState();
    })
    .finally(() => reveal());
})();
