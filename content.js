/*
  Site settings, site copy, and the list of what to show.
  The writing itself lives in Markdown files:

    writeups/<writeup>.md           a CTF or lab writeup
    research/<entry>.md             an AI security research entry
    projects/<project>/index.md     a project: details at the top, overview below
    projects/<project>/<note>.md    a writeup about that project
    blog/<post>.md                  a blog post

  To publish something, create the Markdown file, then add its name (the file
  name without .md) to the matching list below. Writeups, research, and posts
  are sorted by date automatically; projects keep the order you list them in.
  The README has a front matter template for each kind.

  Links: leave a URL empty and it is hidden instead of rendering a dead link.
  Copy rule for this site: avoid hyphens and dashes inside sentences, rewrite instead.
*/
window.PORTFOLIO = {
  name: "Evan Yu",
  handle: "evan",
  host: "kaizeyu",
  role: "Red teaming and AI security",
  email: "hi@kaizeyu.com",
  url: "https://kaizeyu.com",
  links: {
    github: "", // e.g. "https://github.com/yourname"
    linkedin: "", // e.g. "https://www.linkedin.com/in/yourname"
    x: "", // e.g. "https://x.com/yourname"
    hackthebox: "", // your public profile, if you want it shown
    tryhackme: "",
  },

  // What to publish. Each name is a Markdown file name without .md.
  writeups: [],
  research: [],
  projects: [], // e.g. { slug: "my-scanner", notes: ["how-it-works"] }
  posts: ["measuring-misaligned-behavior-in-LLM"],

  // Blog posts with any of these tags are also listed on the research page
  researchTags: ["AI Safety Research", "AI Security"],

  // The first screen of the home page
  hero: {
    eyebrow: "Red teaming · AI security",
    headline: ["Breaking systems", "to learn how they hold."],
    subheadline:
      "Writeups from CTFs and practice labs, research on attacking AI systems, and the tools built along the way.",
    primary: { label: "Read the writeups", href: "writeups.html" },
    secondary: { label: "See the research", href: "research.html" },
    // The terminal beside the headline.
    // `listing: true` prints live counts; `recent: 3` prints the three newest items published.
    terminal: [
      { cmd: "cat scope.txt", out: ["web exploitation · privilege escalation", "active directory · AI red teaming"] },
      { cmd: "ls -l ~", listing: true },
      { cmd: "tail -n 3 changelog", recent: 3 },
    ],
    terminalCaption: "Updates automatically as new work is published.",
  },

  // The three areas of work, shown under the hero
  scope: {
    eyebrow: "Scope",
    title: "Three ways in",
    sub: "Every section starts from the same question: what happens when a system is used in a way its builders never planned for?",
    items: [
      {
        key: "writeups",
        tag: "Practice",
        title: "Writeups",
        text: "Full walkthroughs of CTF challenges and lab machines, from the first scan to the final flag, dead ends included.",
        href: "writeups.html",
      },
      {
        key: "research",
        tag: "AI red teaming",
        title: "Research",
        text: "How language models and AI agents break under adversarial pressure, and how to measure the failures that are easy to miss.",
        href: "research.html",
      },
      {
        key: "projects",
        tag: "Tooling",
        title: "Projects",
        text: "Offensive tools and lab environments, each with a breakdown of how it works and why it exists.",
        href: "projects.html",
      },
    ],
  },

  // The message of the day block on the home page. `mark` is highlighted in red inside `lead`.
  motd: {
    lead: "Nothing is 100% secure.",
    mark: "100%",
    text: "Every system has gaps, and understanding them is how systems get stronger.",
  },


  contact: {
    eyebrow: "Contact",
    headline: ["Found a flaw?", "Let's talk."],
    intro:
      "Questions about a writeup, corrections to the research, job opportunities, or an open seat on a CTF team. Every message gets a reply within a few days.",
    topics: ["A writeup", "Research", "Job opportunity", "CTF team", "Security report", "Something else"],
    submit: "Send message",
    disclosure: "Found a vulnerability on this site? Choose \"Security report\" above. The disclosure policy is in",
  },
};
