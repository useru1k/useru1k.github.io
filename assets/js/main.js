const CONTENT_INDEX_PATH = "content/index.json";
let revealObserver;

const fmtDate = (value) =>
  new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

async function loadContentIndex() {
  const response = await fetch(CONTENT_INDEX_PATH);
  if (!response.ok) {
    throw new Error("Unable to load content index.");
  }
  return response.json();
}

function createCard(item) {
  const articleType = item.type === "posts" ? "Blog" : "Writeup";
  const tags = item.tags.map((tag) => `<span>#${tag}</span>`).join("");

  return `
    <article class="card reveal">
      <p class="kicker">${articleType}</p>
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
      <div class="card-meta">
        <span>${fmtDate(item.date)}</span>
        <span>${item.readTime}</span>
      </div>
      <div class="tags">${tags}</div>
      <a class="card-link" href="post.html?type=${item.type}&slug=${item.slug}">Read article</a>
    </article>
  `;
}

function setActiveListingNav(type) {
  const navBlog = document.querySelector("#nav-blog");
  const navWriteups = document.querySelector("#nav-writeups");

  if (type === "posts") {
    navBlog?.classList.add("active");
  }
  if (type === "writeups") {
    navWriteups?.classList.add("active");
  }
}

async function renderHome() {
  const index = await loadContentIndex();
  const latestPosts = index.posts.slice(0, 3);
  const latestWriteups = index.writeups.slice(0, 3);

  const postsTarget = document.querySelector("#latest-posts");
  const writeupsTarget = document.querySelector("#latest-writeups");

  postsTarget.innerHTML = latestPosts.map(createCard).join("");
  writeupsTarget.innerHTML = latestWriteups.map(createCard).join("");
  observeReveals();
}

async function renderListing() {
  const type = getQueryParam("type") === "writeups" ? "writeups" : "posts";
  setActiveListingNav(type);

  const titleEl = document.querySelector("#list-title");
  const descriptionEl = document.querySelector("#list-description");
  const cardsEl = document.querySelector("#listing-cards");

  const index = await loadContentIndex();
  const items = index[type];

  titleEl.textContent = type === "posts" ? "Research Blog" : "Security Writeups";
  descriptionEl.textContent =
    type === "posts"
      ? "Long-form technical analysis, threat tradecraft, and defensive strategy."
      : "Challenge solutions, exploitation paths, and practical post-exploitation notes.";

  cardsEl.innerHTML = items.map(createCard).join("");
  observeReveals();
}

function buildArticleMeta(item) {
  const typeLabel = item.type === "posts" ? "Blog Post" : "Writeup";
  return `${fmtDate(item.date)} • ${item.readTime} • ${typeLabel}`;
}

async function renderPost() {
  const type = getQueryParam("type") === "writeups" ? "writeups" : "posts";
  const slug = getQueryParam("slug");

  if (!slug) {
    throw new Error("Missing article slug.");
  }

  const index = await loadContentIndex();
  const item = index[type].find((entry) => entry.slug === slug);

  if (!item) {
    throw new Error("Article not found in index.");
  }

  const markdownResponse = await fetch(item.path);
  if (!markdownResponse.ok) {
    throw new Error("Unable to load article markdown.");
  }

  const markdown = await markdownResponse.text();

  marked.setOptions({
    headerIds: true,
    mangle: false,
    breaks: false,
  });

  const renderedHtml = marked.parse(markdown);
  const cleanHtml = DOMPurify.sanitize(renderedHtml);

  document.querySelector("#article-type").textContent =
    item.type === "posts" ? "Research Blog" : "Security Writeup";
  document.querySelector("#article-title").textContent = item.title;
  document.querySelector("#article-meta").textContent = buildArticleMeta(item);

  const tagsEl = document.querySelector("#article-tags");
  tagsEl.innerHTML = item.tags.map((tag) => `<span>#${tag}</span>`).join("");

  const contentEl = document.querySelector("#article-content");
  contentEl.innerHTML = cleanHtml;

  if (window.hljs && typeof window.hljs.highlightElement === "function") {
    document.querySelectorAll("pre code").forEach((block) => window.hljs.highlightElement(block));
  }
}

function observeReveals() {
  const revealElements = document.querySelectorAll(".reveal:not(.visible)");

  if (!revealObserver) {
    revealElements.forEach((el) => el.classList.add("visible"));
    return;
  }

  revealElements.forEach((el) => revealObserver.observe(el));
}

function runRevealAnimation() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  observeReveals();
}

function setYear() {
  const yearNode = document.querySelector("#year");
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }
}

async function bootstrap() {
  try {
    setYear();
    runRevealAnimation();

    const page = window.location.pathname.split("/").pop() || "index.html";

    if (page === "index.html" || page === "") {
      await renderHome();
      return;
    }

    if (page === "listing.html") {
      await renderListing();
      return;
    }

    if (page === "post.html") {
      await renderPost();
      return;
    }
  } catch (error) {
    const fallbackContainer =
      document.querySelector("#article-content") ||
      document.querySelector("#listing-cards") ||
      document.querySelector("#latest-posts");

    if (fallbackContainer) {
      fallbackContainer.innerHTML = `<p class="error">${error.message}</p>`;
    }
  }
}

bootstrap();
