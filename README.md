# kaizeyu.com

A security portfolio: CTF and lab writeups, AI security research, security projects, and a blog. It is a static site with no build step, and every piece of writing is a Markdown file.

## Preview
The site loads Markdown with `fetch`, so serve it locally instead of double clicking `index.html`:
```sh
python3 -m http.server 4173
```
Then open http://localhost:4173. If a change does not show up, hard refresh with Cmd + Shift + R.

## Where things live
```
content.js                       site copy, links, and the lists of what to publish
writeups/<name>.md               a CTF or lab writeup
research/<name>.md               an AI security research report
projects/<name>/index.md         a project: details at the top, overview below
projects/<name>/<note>.md        a build note for that project
blog/<name>.md                   a blog post
.well-known/security.txt         security contact (RFC 9116). Renew Expires every year.
```
To publish anything: create the Markdown file, then add its name (without `.md`) to the matching list in `content.js`. Writeups, research, and posts sort by date on their own. Projects keep the order you list them in. Empty sections are hidden on the home page, and the counts in the hero terminal update automatically.

## Writeup
`writeups/htb-example.md`, then add `"htb-example"` to `writeups` in `content.js`.
```md
---
title: "Example: from an exposed backup to root"
date: 2026-11-20
platform: Hack The Box
category: Web
difficulty: Medium
os: Linux
tags: [LFI, Sudo misconfiguration]
excerpt: One sentence for the list and the top of the page.
---

## Recon
...
```
- `category` becomes a filter on the writeups page. Use a small fixed set: Web, Pwn, Reverse, Crypto, Forensics, OSINT, Active Directory, Linux, Windows.
- `difficulty` colors the badge: Easy, Medium, Hard, and Insane have their own colors. Anything else is shown in cyan.
- `os` is optional and shows as "Target" in the fact box.
- Three or more `##` headings add a contents list automatically. Use `## Recon`, `## Foothold`, `## Privilege escalation`, `## Lessons` as a default structure.
- Every writeup shows a spoiler warning. Publish only retired machines and finished events, as the page promises, and follow each platform's rules on writeups.

## Research report
`research/my-report.md`, then add `"my-report"` to `research` in `content.js`.
```md
---
title: Indirect prompt injection in tool using agents
date: 2026-11-15
status: Ongoing
area: Prompt injection
tags: [Agents, Evaluation]
excerpt: The question this work answers, in one sentence.
links:
  paper:
  code: https://github.com/you/repo
  data:
  slides:
---

## Question
## Method
## Results
## Limitations
```
- `status` sets the pill: Ongoing or Draft pulse amber, Complete or Published show green.
- `area` becomes a filter once there are two or more areas.
- Blog posts tagged with anything in `researchTags` (in `content.js`) are also listed under "Related notes" on the research page.

## Project
`projects/my-tool/index.md`, then add `{ slug: "my-tool", notes: [] }` to `projects` in `content.js`.
```md
---
title: My Tool
year: 2026
category: Recon
featured: true
summary: One or two sentences for the card and the top of the project page.
outcome:
  value: 10x
  label: faster than a naive connect scan
stack: [Python, Scapy]
links:
  source: https://github.com/you/my-tool
  demo:
---

How it works, in Markdown. It appears under "How it works" on the project page.
```
`featured: true` puts a project on the home page (two at most). Leave `outcome` or a link empty and it is hidden. For a build note, create `projects/my-tool/my-note.md` with `title`, `date`, and `excerpt`, and add `"my-note"` to that project's `notes` list.

## Blog post
`blog/my-post.md`, then add `"my-post"` to `posts` in `content.js`.
```md
---
title: My post title
date: 2026-11-10
tags: [AI Security]
excerpt: One sentence shown in lists and under the title.
---
```

## Markdown notes
- Use `##` for sections. The title comes from the front matter.
- Fenced code blocks with a language (```` ```bash ````, ```` ```python ````) get syntax colors, a language label, and a copy button.
- Put images next to the Markdown file and link them relatively, for example `![nmap output](nmap.png)` inside `writeups/`. Redact IPs, flags, and credentials that should not be public.
- File names become URLs, so use lowercase words joined by hyphens.
- Site copy avoids hyphens and dashes inside sentences. Rewrite instead.

## Security
- Every page sets a Content Security Policy and a strict referrer policy in a meta tag. If you add a script, font, or stylesheet from a new host, add that host to the policy in every page's `<head>`, or it will be blocked.
- Third party scripts and the icon stylesheet are pinned to exact versions and checked with Subresource Integrity. If you change a version, regenerate the hash:
  ```sh
  curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A
  ```
- There are no analytics and no cookies. The footer says so, so keep it true.

## Deploy
Hosted on GitHub Pages at https://kaizeyu.com. Push to `main` and it updates within a minute or two. `.nojekyll` keeps GitHub from processing the Markdown files and lets `.well-known/` be served. `CNAME` holds the custom domain.

- `robots.txt` lets search engines in. To ask AI training crawlers to stay out, uncomment the block inside it.
- `sitemap.xml` lists the main pages.
- If the domain changes, update `og:image` and `twitter:image` in each page, `url` in `content.js`, `robots.txt`, `sitemap.xml`, and `.well-known/security.txt`.
