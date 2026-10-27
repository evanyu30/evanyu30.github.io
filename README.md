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
The site is hosted on GitHub Pages at https://kaizeyu.com. Push to `main` and it updates within a minute or two. `.nojekyll` keeps GitHub from converting the Markdown files, and `CNAME` (created by GitHub) holds the custom domain.

- `robots.txt` lets search engines in. To ask AI training crawlers to stay out, uncomment the block inside it.
- `sitemap.xml` lists the main pages for search engines.
- If the domain ever changes, update `og:image` and `twitter:image` in each page, `robots.txt`, `sitemap.xml`, and the `url` in the structured data in `main.js`.
