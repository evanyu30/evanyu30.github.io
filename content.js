/*
  Site settings, and the list of what to show.
  The writing itself lives in Markdown files:

    projects/<project>/index.md     a project: details at the top, overview below
    projects/<project>/<writeup>.md a writeup for that project
    blog/<post>.md                  a blog post

  To add something, create the Markdown file, then add its name (the file name
  without .md) to the right list below. The order of `projects` is the order on
  the site; writeups and posts are sorted by date automatically.

  EXAMPLES: the one project (with its writeup) and the one blog post are
  placeholders that show the format. Replace them with your own.

  Links: leave a URL empty and it is hidden instead of rendering a dead link.
  Copy rule for this site: avoid hyphens inside sentences, rewrite instead.
*/
window.PORTFOLIO = {
  name: "Evan Yu",
  role: "AI engineer",
  email: "hi@kaizeyu.com",
  links: {
    github: "",   // e.g. "https://github.com/yourname"
    linkedin: "", // e.g. "https://www.linkedin.com/in/yourname"
    x: "",        // e.g. "https://x.com/yourname"
  },

  // Projects, in display order. Each folder holds index.md plus one file per writeup.
  projects: [
    { slug: "spool", writeups: ["paging-the-kv-cache"] },
  ],

  // Blog posts in the blog folder. Learning notes and opinions, not project writeups.
  posts: [
    "what-attention-actually-computes",
  ],

  // The first screen of the home page
  hero: {
    eyebrow: "Evan Yu · Portfolio",
    headline: ["Going deeper into AI,", "one project at a time."],
    subheadline:
      "A place where I keep the things I build and the notes I write as I dig further into how AI really works.",
    index: [
      { num: "01", label: "Projects", text: "Things I have built, each with its own writeups", href: "projects.html" },
      { num: "02", label: "Blog", text: "Notes and opinions from what I am learning", href: "blog.html" },
    ],
    // The attention matrix beside the headline. Rows are the headline's own tokens.
    attention: {
      tokens: ["Going", "deeper", "into", "AI", ",", "one", "project", "at", "a", "time", "."],
      // Extra pull between tokens, [from, to, strength]: "project" looks back at "AI", "time" at "one"
      links: [[1, 0, 0.7], [3, 1, 0.8], [6, 3, 0.9], [9, 5, 0.75], [7, 6, 0.4], [10, 9, 0.5]],
      caption: "Causal attention over the headline. Each word looks back at the words before it.",
    },
  },

  tagline:
    "The interesting parts of AI rarely make the headlines. They sit a few layers down, and that is where I like to dig.",

  contact: {
    eyebrow: "Contact",
    headline: ["Have a thought?", "I'd love to hear it."],
    intro:
      "Questions about a project, corrections to a post, or an idea worth building together. I read everything and reply within a few days.",
    topics: ["A question", "A correction", "Collaboration", "Hello"],
    submit: "Send message",
  },
};
