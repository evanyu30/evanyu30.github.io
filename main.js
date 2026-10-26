(() => {
  const C = window.PORTFOLIO;
  if (!C) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const slot = (name) => $(`[data-slot="${name}"]`);
  const fill = (name, text) => $$(`[data-slot="${name}"]`).forEach((el) => (el.textContent = text));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const page = document.body.dataset.page;

  const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  const formatDate = (iso) => dateFmt.format(new Date(`${iso}T12:00:00`));
  const readingTime = (item) => `${Math.max(1, Math.round(item.body.split(/\s+/).length / 220))} min read`;
  const count = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const byDateDesc = (a, b) => String(b.date).localeCompare(String(a.date));
  const tagList = (items, label) =>
    `<ul class="tags" aria-label="${label}">${items.map((t) => `<li class="tag">${esc(t)}</li>`).join("")}</ul>`;
  const addJsonLd = (data) => {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  };
  const socialLinks = [
    ["GitHub", C.links.github, "ph-github-logo"],
    ["LinkedIn", C.links.linkedin, "ph-linkedin-logo"],
    ["X", C.links.x, "ph-x-logo"],
  ].filter(([, url]) => url);

  /* ---------- Shell: nav and footer ---------- */
  const navItems = [
    ["home", "Home", "index.html"],
    ["projects", "Projects", "projects.html"],
    ["blog", "Blog", "blog.html"],
  ];
  const current = page === "post" ? "blog" : page === "project" ? "projects" : page;
  const cur = (key) => (key === current ? ' aria-current="page"' : "");

  const allNav = [...navItems, ["contact", "Contact", "contact.html"]];

  $(".skip-link").insertAdjacentHTML(
    "afterend",
    `<header class="nav-wrap">
      <nav aria-label="Primary">
        <ul class="nav-links">
          ${allNav.map(([k, label, href]) => `<li><a href="${href}"${cur(k)}>${label}</a></li>`).join("")}
        </ul>
      </nav>
    </header>`
  );

  $("main").insertAdjacentHTML(
    "afterend",
    `<footer class="footer">
      <div class="container footer-inner">
        <p class="footer-name">${esc(C.name)} · ${new Date().getFullYear()}</p>
        <ul class="footer-links">
          ${allNav.map(([, label, href]) => `<li><a href="${href}">${label}</a></li>`).join("")}
          ${socialLinks
            .map(
              ([label, url, icon]) =>
                `<li><a href="${esc(url)}" target="_blank" rel="noopener"><i class="ph ${icon}" aria-hidden="true"></i>${label}</a></li>`
            )
            .join("")}
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
  const loadProject = async (entry) => {
    const p = await loadMarkdown(`projects/${entry.slug}/index.md`);
    return { ...p, slug: entry.slug, writeupSlugs: entry.writeups || [], stack: toList(p.stack) };
  };
  // A listed file that is missing (for example an untracked sample) is skipped, not fatal
  const loadAll = (tasks) =>
    Promise.allSettled(tasks).then((results) =>
      results.flatMap((r) => {
        if (r.status === "fulfilled") return [r.value];
        console.warn(r.reason);
        return [];
      })
    );
  const loadProjects = () => loadAll(C.projects.map(loadProject));
  const loadWriteups = (p) =>
    loadAll(
      p.writeupSlugs.map(async (slug) => ({ ...(await loadMarkdown(`projects/${p.slug}/${slug}.md`)), slug }))
    ).then((list) => list.sort(byDateDesc));
  const loadPosts = () =>
    loadAll(
      C.posts.map(async (slug) => {
        const post = await loadMarkdown(`blog/${slug}.md`);
        return { ...post, slug, tags: toList(post.tags) };
      })
    ).then((list) => list.sort(byDateDesc));

  // Render Markdown into the article styles. Image and link paths are relative to the .md file.
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
      if (/^https?:/.test(href)) {
        a.target = "_blank";
        a.rel = "noopener";
      }
    });
    // The page title is the only h1, so headings in the body start at h2
    $$("h1", box).forEach((h) => {
      const h2 = document.createElement("h2");
      h2.innerHTML = h.innerHTML;
      h.replaceWith(h2);
    });
    [...box.children].forEach((child, i) => {
      child.classList.add("reveal");
      child.style.setProperty("--delay", `${Math.min(i, 2) * 80}ms`);
    });
    return box.innerHTML;
  };

  /* ---------- Shared pieces ---------- */
  const linkDefs = [
    ["source", "Source", "ph-github-logo"],
    ["demo", "Demo", "ph-arrow-up-right"],
  ];
  const external = (url) => /^https?:/.test(url);
  const projectLinks = (p) =>
    linkDefs
      .filter(([k]) => p.links && p.links[k])
      .map(
        ([k, label, icon]) =>
          `<a class="btn btn-sm btn-ghost" href="${esc(p.links[k])}"${external(p.links[k]) ? ' target="_blank" rel="noopener"' : ""}><i class="ph ${icon}" aria-hidden="true"></i>${label}</a>`
      )
      .join("");
  const projectHref = (p) => `project.html?slug=${encodeURIComponent(p.slug)}`;
  const writeupHref = (p, w) => `${projectHref(p)}&w=${encodeURIComponent(w.slug)}`;

  // One simple card: when, what, the key result. The whole card opens the project.
  const projectCard = (p, i, heading = "h3") => `<a class="project-card reveal" href="${projectHref(p)}" data-index="${i}" style="--delay:${(i % 2) * 120}ms">
    <p class="project-meta"><span>${esc(p.year || "")}</span><span aria-hidden="true">·</span><span>${esc(p.category || "")}</span></p>
    <${heading} class="project-title">${esc(p.title)}</${heading}>
    <p class="project-summary">${esc(p.summary || "")}</p>
    ${p.outcome ? `<p class="project-outcome"><strong>${esc(p.outcome.value)}</strong>${esc(p.outcome.label)}</p>` : ""}
    <div class="project-foot">
      <span class="project-stack">${p.stack.map(esc).join(" · ")}</span>
      <span class="project-more">View project<i class="ph ph-arrow-right" aria-hidden="true"></i></span>
    </div>
  </a>`;

  // A row in an article list. Blog posts by default; project writeups pass their own href.
  const postRow = (post, i, heading = "h3", href = `post.html?slug=${encodeURIComponent(post.slug)}`) => `<li class="reveal" data-index="${i}" style="--delay:${Math.min(i, 3) * 80}ms">
    <a class="post-row" href="${href}">
      <time class="post-date" datetime="${esc(post.date)}">${formatDate(post.date)}</time>
      <div class="post-info">
        <${heading} class="post-title">${esc(post.title)}</${heading}>
        <p class="post-excerpt">${esc(post.excerpt || "")}</p>
        <div class="post-meta-row"><span>${readingTime(post)}</span>${post.tags && post.tags.length ? tagList(post.tags, "Topics") : ""}</div>
      </div>
      <i class="ph ph-arrow-right post-arrow" aria-hidden="true"></i>
    </a>
  </li>`;

  const emptyState = (icon, title, text, action = "") => `<div class="empty reveal">
    <i class="ph ${icon}" aria-hidden="true"></i>
    <p><strong>${esc(title)}</strong></p>
    <p>${esc(text)}</p>
    ${action}
  </div>`;
  const loadErrorState = () =>
    emptyState(
      "ph-warning-circle",
      "This content could not be loaded.",
      location.protocol === "file:"
        ? "The site reads Markdown files, which browsers block when a page is opened straight from disk. Start the local server described in the README and open it from there."
        : "Check that the Markdown file exists and is listed in content.js, then refresh."
    );

  // Filter chips that show and hide list items by key
  const setupFilter = ({ chipsEl, statusEl, listEl, items, keysOf, noun }) => {
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
    const nodes = $$("[data-index]", listEl);
    const apply = (key) => {
      let shown = 0;
      nodes.forEach((n) => {
        const match = key === "All" || keysOf(items[n.dataset.index]).includes(key);
        n.hidden = !match;
        if (match) shown++;
      });
      statusEl.textContent = `Showing ${shown} of ${count(items.length, noun)}`;
      $$(".chip", chipsEl).forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.key === key)));
    };
    chipsEl.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (chip) apply(chip.dataset.key);
    });
    apply("All");
  };

  /* ---------- Article view, shared by blog posts and project writeups ---------- */
  const setMeta = (title, description) => {
    document.title = `${title} · ${C.name}`;
    $('meta[name="description"]').setAttribute("content", description);
    $("head").insertAdjacentHTML(
      "beforeend",
      `<meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(description)}" />`
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
    return newer || older ? `<nav class="post-nav" aria-label="More articles">${link(newer, "newer")}${link(older, "older")}</nav>` : "";
  };
  const renderArticle = (el, { back, kicker = "", item, tagsHtml = "", navHtml = "" }) => {
    el.innerHTML = `
      <a class="back-link reveal" href="${back.href}"><i class="ph ph-arrow-left" aria-hidden="true"></i> ${esc(back.label)}</a>
      <header class="article-head">
        <p class="article-meta reveal" style="--delay:80ms">
          ${kicker ? `<span>${esc(kicker)}</span><span aria-hidden="true">·</span>` : ""}<time datetime="${esc(item.date)}">${formatDate(item.date)}</time><span aria-hidden="true">·</span><span>${readingTime(item)}</span>
        </p>
        <h1 class="hero-title reveal" style="--delay:120ms">${esc(item.title)}</h1>
        ${item.excerpt ? `<p class="hero-sub reveal" style="--delay:160ms">${esc(item.excerpt)}</p>` : ""}
        ${tagsHtml ? `<div class="reveal" style="--delay:200ms">${tagsHtml}</div>` : ""}
      </header>
      <div class="prose">${renderMarkdown(item.body, item.dir)}</div>
      ${navHtml}`;
  };

  /* ---------- Pages ---------- */
  const pages = {
    async home() {
      fill("hero-eyebrow", C.hero.eyebrow);
      fill("subheadline", C.hero.subheadline);
      slot("headline").innerHTML = C.hero.headline.map((l) => `<span class="line">${esc(l)}</span>`).join("");
      slot("hero-index").innerHTML = C.hero.index
        .map(
          (item) => `<li><a class="index-link" href="${esc(item.href)}">
            <span class="index-num">${esc(item.num)}</span>
            <span class="index-body"><span class="index-label">${esc(item.label)}</span><span class="index-text">${esc(item.text)}</span></span>
            <i class="ph ph-arrow-right index-arrow" aria-hidden="true"></i>
          </a></li>`
        )
        .join("");
      initAttention(C.hero.attention);
      initTagline();
      addJsonLd({
        "@context": "https://schema.org",
        "@type": "Person",
        name: C.name,
        jobTitle: C.role,
        email: `mailto:${C.email}`,
        sameAs: [C.links.github, C.links.linkedin, C.links.x].filter(Boolean),
      });
      reveal();

      // The overview below the first screen is pulled from the project and blog files
      await Promise.all([
        loadProjects()
          .then((projects) => {
            const featured = projects.filter((p) => p.featured);
            const shown = (featured.length ? featured : projects).slice(0, 2);
            slot("featured-projects").innerHTML = shown.length
              ? shown.map((p, i) => projectCard(p, i)).join("")
              : emptyState("ph-hammer", "New projects are on the way.", "Add your first one and it will show up here.");
            const allLink = slot("all-projects-link");
            allLink.innerHTML = `See ${projects.length === 1 ? "the project" : `all ${count(projects.length, "project")}`} <i class="ph ph-arrow-right" aria-hidden="true"></i>`;
            allLink.closest(".section-foot").hidden = !projects.length;
          })
          .catch((err) => {
            console.error(err);
            slot("featured-projects").innerHTML = loadErrorState();
          }),
        loadPosts()
          .then((posts) => {
            slot("latest-posts").innerHTML = posts.length
              ? posts.slice(0, 3).map((p, i) => postRow(p, i)).join("")
              : `<li>${emptyState("ph-pencil-simple-line", "The first post is on its way.", "Check back soon.")}</li>`;
          })
          .catch((err) => {
            console.error(err);
            slot("latest-posts").innerHTML = `<li>${loadErrorState()}</li>`;
          }),
      ]);
    },

    async projects() {
      const listEl = slot("project-list");
      const projects = await loadProjects();
      if (!projects.length) {
        listEl.innerHTML = emptyState("ph-hammer", "New projects are on the way.", "Add your first one and it will show up here.");
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
      const posts = await loadPosts();
      if (!posts.length) {
        listEl.innerHTML = `<li>${emptyState("ph-pencil-simple-line", "The first post is on its way.", "Add a Markdown file to the blog folder and list it in content.js.")}</li>`;
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

    async post() {
      const el = slot("article");
      const slugParam = new URLSearchParams(location.search).get("slug");
      if (!C.posts.includes(slugParam)) {
        document.title = `Post not found · ${C.name}`;
        el.innerHTML = emptyState(
          "ph-file-x",
          "This post does not exist.",
          "It may have been renamed or removed. Every post is listed on the blog.",
          `<a class="btn btn-primary" href="blog.html"><i class="ph ph-arrow-left" aria-hidden="true"></i>Back to the blog</a>`
        );
        return;
      }

      const posts = await loadPosts();
      const idx = posts.findIndex((p) => p.slug === slugParam);
      if (idx < 0) throw new Error(`Could not load blog/${slugParam}.md`);
      const post = posts[idx];
      setMeta(post.title, post.excerpt || "");
      renderArticle(el, {
        back: { href: "blog.html", label: "All posts" },
        item: post,
        tagsHtml: post.tags.length ? tagList(post.tags, "Topics") : "",
        navHtml: articleNav(posts[idx - 1], posts[idx + 1], (p) => `post.html?slug=${encodeURIComponent(p.slug)}`),
      });

      addJsonLd({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt || "",
        datePublished: post.date,
        author: { "@type": "Person", name: C.name },
      });
    },

    async project() {
      const el = slot("project");
      const params = new URLSearchParams(location.search);
      const entry = C.projects.find((x) => x.slug === params.get("slug"));

      if (!entry) {
        document.title = `Project not found · ${C.name}`;
        el.innerHTML = emptyState(
          "ph-file-x",
          "This project does not exist.",
          "It may have been renamed or removed. Every project is listed on the projects page.",
          `<a class="btn btn-primary" href="projects.html"><i class="ph ph-arrow-left" aria-hidden="true"></i>Back to projects</a>`
        );
        return;
      }

      const p = await loadProject(entry);
      const writeups = await loadWriteups(p);
      const wSlug = params.get("w");

      // One writeup, read inside its project
      if (wSlug) {
        const idx = writeups.findIndex((w) => w.slug === wSlug);
        if (idx < 0) {
          document.title = `Writeup not found · ${C.name}`;
          el.innerHTML = emptyState(
            "ph-file-x",
            "This writeup does not exist.",
            `It may have been renamed or removed. Every writeup for ${p.title} is listed on its project page.`,
            `<a class="btn btn-primary" href="${projectHref(p)}"><i class="ph ph-arrow-left" aria-hidden="true"></i>Back to ${esc(p.title)}</a>`
          );
          return;
        }
        const w = writeups[idx];
        setMeta(`${w.title} · ${p.title}`, w.excerpt || "");
        renderArticle(el, {
          back: { href: projectHref(p), label: p.title },
          kicker: "Writeup",
          item: w,
          navHtml: articleNav(writeups[idx - 1], writeups[idx + 1], (x) => writeupHref(p, x)),
        });
        return;
      }

      // Project overview, then its writeups
      setMeta(p.title, p.summary || "");
      const links = projectLinks(p);
      el.innerHTML = `
        <a class="back-link reveal" href="projects.html"><i class="ph ph-arrow-left" aria-hidden="true"></i> All projects</a>
        <header class="article-head">
          <p class="article-meta reveal" style="--delay:80ms"><span>${esc(p.year || "")}</span><span aria-hidden="true">·</span><span>${esc(p.category || "")}</span></p>
          <h1 class="hero-title reveal" style="--delay:120ms">${esc(p.title)}</h1>
          ${p.summary ? `<p class="hero-sub reveal" style="--delay:160ms">${esc(p.summary)}</p>` : ""}
          ${links ? `<div class="project-actions reveal" style="--delay:200ms">${links}</div>` : ""}
        </header>
        <dl class="project-facts reveal">
          ${p.outcome ? `<div><dt>Result</dt><dd><strong>${esc(p.outcome.value)}</strong> ${esc(p.outcome.label)}</dd></div>` : ""}
          ${p.stack.length ? `<div><dt>Built with</dt><dd>${p.stack.map(esc).join(" · ")}</dd></div>` : ""}
        </dl>
        ${
          p.body
            ? `<section class="project-section" aria-labelledby="overview-title">
                <h2 class="project-section-title reveal" id="overview-title">Overview</h2>
                <div class="prose">${renderMarkdown(p.body, p.dir)}</div>
              </section>`
            : ""
        }
        <section class="project-section" aria-labelledby="writeups-title">
          <h2 class="project-section-title reveal" id="writeups-title">Writeups <span class="section-count">${writeups.length}</span></h2>
          ${
            writeups.length
              ? `<ul class="post-list">${writeups.map((w, i) => postRow(w, i, "h3", writeupHref(p, w))).join("")}</ul>`
              : `<p class="project-empty reveal">No writeups yet. They will show up here as I write them.</p>`
          }
        </section>`;
    },

    contact() {
      fill("contact-eyebrow", C.contact.eyebrow);
      fill("contact-intro", C.contact.intro);
      fill("contact-submit", C.contact.submit);
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
              `<li><a class="btn btn-sm btn-ghost" href="${esc(url)}" target="_blank" rel="noopener"><i class="ph ${icon}" aria-hidden="true"></i>${label}</a></li>`
          )
          .join("");
      } else {
        social.hidden = true;
      }
      initForm();
    },
  };

  /* ---------- Behaviours ---------- */
  // Causal attention over the headline: rows light up one at a time, like decoding
  function initAttention(att) {
    const grid = slot("attention");
    fill("attention-caption", att.caption);
    const n = att.tokens.length;
    grid.style.setProperty("--n", n);
    const pull = new Map(att.links.map(([from, to, w]) => [`${from}:${to}`, w]));
    grid.innerHTML = att.tokens
      .map((tok, i) => {
        // Raw scores: an attention sink on the first token, the token itself, its neighbor, and named links
        const raw = Array.from({ length: i + 1 }, (_, j) =>
          Math.max(
            0.1 + ((i * 7 + j * 3) % 5) * 0.03,
            j === 0 ? 0.45 : 0,
            j === i ? 0.75 : 0,
            j === i - 1 ? 0.35 : 0,
            pull.get(`${i}:${j}`) || 0
          )
        );
        const max = Math.max(...raw);
        const cells = Array.from({ length: n }, (_, j) =>
          j <= i ? `<span class="att-cell" style="--w:${(raw[j] / max).toFixed(2)}"></span>` : `<span class="att-cell masked"></span>`
        ).join("");
        return `<div class="att-row"><span class="att-token">${esc(tok)}</span>${cells}</div>`;
      })
      .join("");

    if (reducedMotion) return;
    const rows = $$(".att-row", grid);
    let step = 0;
    const tick = () => {
      rows.forEach((r, i) => {
        r.classList.toggle("is-active", i === step);
        r.classList.toggle("is-future", i > step);
      });
      step = (step + 1) % (n + 4); // a short pause with the whole matrix shown
    };
    tick();
    setInterval(tick, 650);
  }

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
    // Only listen while the section is near the viewport.
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
      name: (v) => (v.trim() ? "" : "Add your name so I know who to reply to."),
      email: (v) =>
        !v.trim() ? "Add your email so I can reply." : emailRe.test(v.trim()) ? "" : "That email looks incomplete. Check for a typo.",
      message: (v) =>
        !v.trim() ? "Write a short message." : v.trim().length < 20 ? "Add a little more detail, at least 20 characters." : "",
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
      const subject = `${topic.value}: from ${name.value.trim()}`;
      const body = `${message.value.trim()}\n\n${name.value.trim()}\n${email.value.trim()}`;
      location.href = `mailto:${C.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.innerHTML = `<i class="ph-fill ph-check-circle" aria-hidden="true"></i>
        <p><strong>Your email app should open with this message ready to send.</strong>
        Nothing opened? Write to me at ${esc(C.email)} and paste your message there.</p>`;
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
        statusEl.textContent = "Copy failed. Select the address above instead.";
      }
      timer = setTimeout(() => (statusEl.textContent = ""), 2400);
    });
  });

  // Static parts fade in right away; loaded content fades in once it arrives.
  // A loading or rendering error shows a message instead of leaving the page blank.
  reveal();
  const mainSlot = { projects: "project-list", blog: "post-list", post: "article", project: "project" }[page];
  Promise.resolve()
    .then(() => pages[page] && pages[page]())
    .catch((err) => {
      console.error(err);
      const el = mainSlot && slot(mainSlot);
      if (el) el.innerHTML = el.tagName === "UL" ? `<li>${loadErrorState()}</li>` : loadErrorState();
    })
    .finally(() => reveal());
})();
