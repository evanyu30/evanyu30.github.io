# Portfolio

Static site, no build step. Projects, writeups, and blog posts are Markdown files.

## Preview
The site reads Markdown files, so open it through a local server rather than double clicking `index.html`:
```sh
python3 -m http.server 4173
```
Then open http://localhost:4173. If a change does not show up, hard refresh with Cmd + Shift + R.

## Where things live
```
content.js                        site settings, home page copy, and the list of what to show
blog/<post>.md                    a blog post: learning notes and opinions
projects/<project>/index.md       a project: details at the top, overview below
projects/<project>/<writeup>.md   a writeup about that project
```
The home page overview pulls from these automatically: featured projects, and the three newest blog posts.

## Write a blog post
1. Create `blog/my-post.md`:
   ```md
   ---
   title: My post title
   date: 2026-11-10
   tags: [Transformers, Notes]
   excerpt: One sentence shown in lists and under the title.
   ---

   Write the post in Markdown here.
   ```
2. Add `"my-post"` to `posts` in `content.js`.

## Add a project
1. Create `projects/my-project/index.md`:
   ```md
   ---
   title: My Project
   year: 2026
   category: Inference
   featured: false
   summary: One or two sentences for the card and the top of the project page.
   outcome:
     value: 2.4x
     label: faster than the baseline
   stack: [Python, CUDA]
   links:
     source: https://github.com/you/my-project
     demo:
   ---

   The overview, in Markdown. It appears on the project page under "Overview".
   ```
2. Add `{ slug: "my-project", writeups: [] }` to `projects` in `content.js`. The order of that list is the order on the site.

`featured: true` puts a project on the home page (two at most). `category` becomes a filter on the projects page. Leave `outcome` or a link out, or empty, and it is hidden.

## Write a project writeup
1. Create `projects/my-project/my-writeup.md`:
   ```md
   ---
   title: What I learned building it
   date: 2026-11-02
   excerpt: One sentence shown in the list and under the title.
   ---

   The writeup, in Markdown.
   ```
2. Add `"my-writeup"` to that project's `writeups` list in `content.js`.

Writeups appear only on their project's page, never on the blog. They are sorted by date automatically.

## Markdown notes
- Use `##` for section headings inside an article; the title already comes from the front matter.
- Bold, links, inline code, code blocks with a language, lists, quotes, tables, and images all work.
- Put images next to the Markdown file and link them relatively, for example `![Trace](trace.png)` inside `projects/lumen/`.
- File names become URLs, so use lowercase words joined by hyphens.

## Deploy
Upload the whole folder to any static host (Vercel, Netlify, GitHub Pages, Cloudflare Pages). Most hosts serve `404.html` automatically. After deploying, change `og:image` in each page to the absolute URL of `og-image.png`.
