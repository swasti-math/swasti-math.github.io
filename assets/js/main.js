/**
 * Main Application Module
 * File: assets/js/main.js
 */

// 1. Global State
let allPosts = [];
let allResources = [];
let allQuotes = [];
let currentQuoteIndex = -1; // Tracks the currently active quote index to prevent repeats
let aboutContent = "";
let currentArchiveSubView = "sequential"; // Default archive tab: 'sequential' | 'chronological' | 'topic'

// Google Form Configuration
const GOOGLE_FORM_BASE_URL = "https://docs.google.com/forms/d/e/1FAIpQLSe7xTbH8qujheFJD2ca8vi-kS979UofRTAlcdGRCZjyJPQtLA/viewform?embedded=true";
const POST_SERIAL_ENTRY_ID = "entry.1647977442";

// 2. DOM Selectors
const homeView = document.getElementById("homeView");
const postView = document.getElementById("postView");
const archiveView = document.getElementById("archiveView");
const aboutView = document.getElementById("aboutView");
const resourcesView = document.getElementById("resourcesView");
const contactView = document.getElementById("contactView");

const postsContainer = document.getElementById("postsContainer");
const articleContainer = document.getElementById("articleContainer");
const archiveContainer = document.getElementById("archiveContainer");
const resourcesContainer = document.getElementById("resourcesContainer");
const searchInput = document.getElementById("searchInput");

// 3. Fetch Data Functions
async function loadPostsData() {
  try {
    const response = await fetch("./assets/data/posts.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    allPosts = await response.json();
    window.postsData = allPosts;

    if (typeof window.filterPosts === "function") {
      window.filterPosts();
    }
    renderArchive(allPosts, currentArchiveSubView);
    handleRoute();
  } catch (error) {
    console.error("Error loading posts.json:", error);
    if (postsContainer) {
      postsContainer.innerHTML = "<p>Error loading articles. Please try again later.</p>";
    }
  }
}

async function loadResourcesData() {
  if (allResources.length > 0) return; // Avoid re-fetching if loaded
  try {
    const response = await fetch("./assets/data/resources.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    allResources = await response.json();
    renderResources(allResources);
  } catch (error) {
    console.error("Error loading resources.json:", error);
    if (resourcesContainer) {
      resourcesContainer.innerHTML = "<p>Error loading resources. Please try again later.</p>";
    }
  }
}

async function loadAboutData() {
  const aboutContainer = document.querySelector("#aboutView .static-page");
  if (!aboutContainer) return;

  if (aboutContent) {
    aboutContainer.innerHTML = aboutContent;
    triggerKaTeX(aboutContainer);
    return;
  }

  try {
    const response = await fetch("./assets/data/about.md");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const rawMarkdown = await response.text();
    const parsedHTML = marked.parse(rawMarkdown);

    aboutContent = `
      <h2>About</h2>
      <div class="post-body">${parsedHTML}</div>
    `;

    aboutContainer.innerHTML = aboutContent;
    triggerKaTeX(aboutContainer);
  } catch (error) {
    console.error("Error loading about.md:", error);
    aboutContainer.innerHTML = `
      <h1>About</h1>
      <p>Unable to load about content at this time.</p>
    `;
  }
}

async function loadRandomQuote() {
  const quoteElem = document.querySelector(".nav-quote");
  if (!quoteElem) return;

  try {
    if (allQuotes.length === 0) {
      const response = await fetch("./assets/data/quotes.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      allQuotes = await response.json();
    }

    if (allQuotes.length === 0) return;

    // Pick a new random index distinct from the current one
    let newIndex = currentQuoteIndex;
    if (allQuotes.length > 1) {
      while (newIndex === currentQuoteIndex) {
        newIndex = Math.floor(Math.random() * allQuotes.length);
      }
    } else {
      newIndex = 0;
    }

    currentQuoteIndex = newIndex;
    const selected = allQuotes[currentQuoteIndex];

    // Trigger smooth fade-out & lift animation
    quoteElem.classList.add("fade-out");

    // Swap text and fade back in after transition completes
    setTimeout(() => {
      quoteElem.innerHTML = `"${selected.quote}" &mdash; <em>${selected.author}</em>`;
      quoteElem.classList.remove("fade-out");
    }, 500); // 500ms matches CSS transition timing

  } catch (error) {
    console.error("Error loading quotes.json:", error);
  }
}

// Loads & Pre-fills Google Form Iframe
function loadContactData(postSno = null) {
  const formIframe = document.getElementById("googleFormIframe");
  if (!formIframe) return;

  if (postSno) {
    // Dynamically inject post number parameter into Google Form URL
    formIframe.src = `${GOOGLE_FORM_BASE_URL}&${POST_SERIAL_ENTRY_ID}=${encodeURIComponent(postSno)}`;
  } else {
    // Load standard blank form
    formIframe.src = GOOGLE_FORM_BASE_URL;
  }
}

// 4. View Switching Helper
function showView(targetView) {
  const allViews = [homeView, postView, archiveView, aboutView, resourcesView, contactView];

  allViews.forEach(view => {
    if (view) {
      view.style.display = (view === targetView) ? "block" : "none";
    }
  });

  window.scrollTo(0, 0);
}

// 5. Render Post Cards Grid (Home View)
function renderPostCards(postsToRender) {
  if (!postsContainer) return;

  postsContainer.innerHTML = "";

  if (postsToRender.length === 0) {
    postsContainer.innerHTML = "<p>No articles found matching your criteria.</p>";
    return;
  }

  const sortedPosts = [...postsToRender].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    const snoA = parseInt(a.sno || 0, 10);
    const snoB = parseInt(b.sno || 0, 10);
    return snoB - snoA;
  });

  sortedPosts.forEach(post => {
    const card = document.createElement("article");
    card.className = "card";

    const pinnedHTML = post.pinned 
      ? `<span class="pinned-badge" title="Pinned Post">📌</span>` 
      : "";

    const tagsHTML = Array.isArray(post.tags)
      ? post.tags.map(t => `<span class="badge">${t.replace(/[-–—]/g, ' ')}</span>`).join(" ")
      : "";

    const snoHTML = post.sno 
      ? `<div style="font-family: 'Nunito', sans-serif; font-weight: bold; font-size: 11pt; color: var(--lColorS2, #666); margin-top: 0.25rem;">${post.sno}</div>` 
      : "";

    const quesRefHTML = post.quesRef
      ? `<div class="post-ques-ref" style="font-family: var(--font-secondary); font-size: 0.85rem; font-weight: 600; color: var(--lColorT1); margin-top: 0.2rem;">${post.quesRef}</div>`
      : "";

    card.innerHTML = `
      <div class="card-header">
        <div class="tags-wrapper">${pinnedHTML}${tagsHTML}</div>
        <span class="read-time">${post.readTime || ""}</span>
      </div>
      ${snoHTML}
      <h2><a href="#post/${post.id}">${post.title}</a></h2>
      <p class="date">${post.date || ""}</p>
      <p class="excerpt">${post.excerpt || ""}</p>
      ${quesRefHTML}
      <a href="#post/${post.id}" class="read-more">Read Article &rarr;</a>
    `;
    postsContainer.appendChild(card);
  });
}

// 6. Render Single Article View & Trigger KaTeX
async function renderSinglePost(postId) {
  if (!allPosts || allPosts.length === 0) {
    try {
      const res = await fetch("./assets/data/posts.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load posts.json`);
      allPosts = await res.json();
      window.postsData = allPosts;
    } catch (e) {
      console.error("Fetch Error:", e);
      return;
    }
  }

  const post = allPosts.find(p => p.id === postId);

  if (!post) {
    if (articleContainer) articleContainer.innerHTML = `<p>Error: Post ID "${postId}" not found.</p>`;
    return;
  }

  const snoHeaderHTML = post.sno 
    ? `<div style="font-family: 'Nunito', sans-serif; font-weight: bold; font-size: 14pt; color: var(--lColorS2, #666); margin-bottom: 0.25rem;">${post.sno}</div>` 
    : "";

  const feedbackBtnHTML = post.sno 
    ? `<div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px dashed var(--border-subtle, #ccc);">
        <a href="#contact?sno=${encodeURIComponent(post.sno)}" class="btn-feedback" style="font-family: 'Nunito', sans-serif; font-weight: bold; font-size: 0.95rem; text-decoration: none; color: var(--lColorS1, #333);">💬 Send your message about this post.</a>
       </div>`
    : "";

  const isPDF = post.type === "pdf" || (post.file && post.file.endsWith(".pdf"));

  if (isPDF) {
    articleContainer.innerHTML = `
      ${snoHeaderHTML}
      <h1>${post.title}</h1>
      <p class="date">${post.date || ""} ${post.readTime ? "• " + post.readTime : ""}</p>
      <div style="margin: 1rem 0;">
        <a href="${post.file}" download class="btn-format" style="display: inline-block; padding: 6px 12px; background: var(--border-subtle, #f0f0f0); text-decoration: none; border-radius: 4px;">📥 Download PDF</a>
      </div>
      <iframe src="${post.file}" width="100%" height="800px" style="border: 1px solid var(--border-subtle, #ccc); border-radius: 8px;">
        <p>Your browser does not support inline PDFs. <a href="${post.file}">Click here to download the PDF.</a></p>
      </iframe>
      ${feedbackBtnHTML}
    `;
    return;
  }

  try {
    const response = await fetch(post.file);
    if (!response.ok) throw new Error(`HTTP ${response.status} - File not found at ${post.file}`);

    const rawContent = await response.text();
    const isHTML = post.type === "html" || (post.file && post.file.endsWith(".html"));
    const contentHTML = isHTML ? rawContent : marked.parse(rawContent);

    articleContainer.innerHTML = `
      ${snoHeaderHTML}
      <h1>${post.title}</h1>
      <p class="date">${post.date || ""} ${post.readTime ? "• " + post.readTime : ""}</p>
      <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid var(--border-subtle);" />
      <div class="post-body">${contentHTML}</div>
      ${feedbackBtnHTML}
    `;

    triggerKaTeX(articleContainer);
  } catch (err) {
    console.error("Render Error:", err);
    articleContainer.innerHTML = `<p style="color: red;">Failed to load article: ${err.message}</p>`;
  }
}

// 7. Render Archive View
function renderArchive(posts, mode = "sequential") {
  if (!archiveContainer) return;

  if (!posts || posts.length === 0) {
    archiveContainer.innerHTML = "<p>No articles available in the archive.</p>";
    return;
  }

  let html = "";

  if (mode === "sequential") {
    const sorted = [...posts].sort((a, b) => {
      const snoA = parseInt(a.sno || 0, 10);
      const snoB = parseInt(b.sno || 0, 10);
      return snoA - snoB;
    });

    html = `<ul class="archive-list">`;
    sorted.forEach(post => {
      const snoBadge = post.sno ? `<strong style="font-family: 'Nunito', sans-serif;font-size: 12pt; color: var(--lColorS2); margin-right: 0.5rem;">[${post.sno}]</strong>` : "";
      const quesRefHTML = post.quesRef ? `<span class="archive-ques-ref" style="font-family: var(--font-secondary); font-size: 0.85rem; font-weight: 600; color: var(--lColorT1); opacity: 0.9;"> (${post.quesRef})</span>` : "";

      html += `
        <li class="archive-item">
          <a href="#post/${post.id}" class="archive-item-title">${snoBadge}${post.title}${quesRefHTML}</a>
          <span class="archive-item-meta">${post.date || ""}</span>
        </li>
      `;
    });
    html += `</ul>`;
  } 
  else if (mode === "chronological") {
    const grouped = posts.reduce((acc, post) => {
      let sortKey = "0000-00";
      let displayKey = "Undated";

      if (post.date) {
        const parsedDate = new Date(post.date);
        if (!isNaN(parsedDate.getTime())) {
          const year = parsedDate.getFullYear();
          const monthNum = String(parsedDate.getMonth() + 1).padStart(2, "0");
          const monthName = parsedDate.toLocaleString("default", { month: "long" });

          sortKey = `${year}-${monthNum}`;
          displayKey = `${year} ${monthName}`;
        }
      }

      if (!acc[sortKey]) {
        acc[sortKey] = { displayKey, posts: [] };
      }
      acc[sortKey].posts.push(post);
      return acc;
    }, {});

    const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    sortedKeys.forEach(key => {
      const group = grouped[key];

      group.posts.sort((a, b) => {
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;
        if (dateA !== dateB) return dateB - dateA;
        return parseInt(b.sno || 0, 10) - parseInt(a.sno || 0, 10);
      });

      html += `
        <div class="archive-group">
          <h2 class="archive-group-title">${group.displayKey}</h2>
          <ul class="archive-list">
      `;

      group.posts.forEach(post => {
        const snoBadge = post.sno ? `<strong style="font-family: 'Nunito', sans-serif;font-size: 12pt; color: var(--lColorS2); margin-right: 0.5rem;">[${post.sno}]</strong>` : "";
        const quesRefHTML = post.quesRef ? `<span class="archive-ques-ref" style="font-family: var(--font-secondary); font-size: 0.85rem; font-weight: 600; color: var(--lColorT1); opacity: 0.9;"> (${post.quesRef})</span>` : "";

        html += `
          <li class="archive-item">
            <a href="#post/${post.id}" class="archive-item-title">${snoBadge}${post.title}${quesRefHTML}</a>
            <span class="archive-item-meta">${post.date || post.readTime || ""}</span>
          </li>
        `;
      });

      html += `</ul></div>`;
    });
  } 
  else if (mode === "topic") {
    const grouped = {};

    posts.forEach(post => {
      const tags = Array.isArray(post.tags) && post.tags.length > 0 ? post.tags : ["General"];
      tags.forEach(rawTag => {
        const tag = rawTag.replace(/[-–—]/g, ' ').toUpperCase();
        if (!grouped[tag]) grouped[tag] = [];
        grouped[tag].push(post);
      });
    });

    const sortedTopics = Object.keys(grouped).sort();

    sortedTopics.forEach(topic => {
      html += `
        <div class="archive-group">
          <h2 class="archive-group-title">${topic}</h2>
          <ul class="archive-list">
      `;
      grouped[topic].forEach(post => {
        const snoBadge = post.sno ? `<strong style="font-family: 'Nunito', sans-serif;font-size: 12pt; color: var(--lColorS2); margin-right: 0.5rem;">[${post.sno}]</strong>` : "";
        const quesRefHTML = post.quesRef ? `<span class="archive-ques-ref" style="font-family: var(--font-secondary); font-size: 0.85rem; font-weight: 600; color: var(--lColorT1); opacity: 0.9;"> (${post.quesRef})</span>` : "";

        html += `
          <li class="archive-item">
            <a href="#post/${post.id}" class="archive-item-title">${snoBadge}${post.title}${quesRefHTML}</a>
            <span class="archive-item-meta">${post.date || ""}</span>
          </li>
        `;
      });
      html += `</ul></div>`;
    });
  }

  archiveContainer.innerHTML = html;
}

// 8. Render Resources View
function renderResources(resources) {
  if (!resourcesContainer) return;

  if (!resources || resources.length === 0) {
    resourcesContainer.innerHTML = "<p>No resources currently listed.</p>";
    return;
  }

  const grouped = resources.reduce((acc, res) => {
    const category = res.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(res);
    return acc;
  }, {});

  let html = "";
  Object.keys(grouped).forEach(category => {
    html += `
      <div class="archive-group" style="margin-bottom: 2rem;">
        <h2 class="archive-group-title">${category}</h2>
        <div class="posts-grid">
    `;

    grouped[category].forEach(item => {
      const authorHTML = item.author ? `<p style="font-size: 0.95rem; color: var(--lColorS2); margin-bottom: 0.5rem; font-style: italic;">${item.author}</p>` : "";
      const badgeHTML = item.badge ? `<span class="badge" style="float: right;">${item.badge}</span>` : "";

      html += `
        <article class="card">
          <div class="card-header">
            ${badgeHTML}
          </div>
          <h2><a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title} &nearr;</a></h2>
          ${authorHTML}
          <p class="excerpt">${item.description || ""}</p>
        </article>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  resourcesContainer.innerHTML = html;
}

// 9. Helper to trigger KaTeX safely
function triggerKaTeX(container) {
  if (typeof renderMathInElement === "function") {
    renderMathInElement(container, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false
    });
  }
}

// 10. Hash Router
function handleRoute() {
  const fullHash = window.location.hash.substring(1);
  const [route, queryString] = fullHash.split("?");

  loadRandomQuote(); // Triggers smooth quote swap on every section navigation

  if (route.startsWith("post/")) {
    const postId = route.replace("post/", "");
    showView(postView);
    renderSinglePost(postId);
  } else if (route === "archive") {
    showView(archiveView);
    renderArchive(allPosts, currentArchiveSubView);
  } else if (route === "about") {
    showView(aboutView);
    loadAboutData();
  } else if (route === "resources") {
    showView(resourcesView);
    loadResourcesData();
  } else if (route === "contact") {
    showView(contactView);
    const queryParams = new URLSearchParams(queryString || "");
    const postSno = queryParams.get("sno");
    loadContactData(postSno);
  } else {
    showView(homeView);
  }
}

// 11. Search and Tag Filter Logic
window.filterPosts = function filterPosts() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const sourcePosts = window.postsData || allPosts;

  const filtered = sourcePosts.filter(post => {
    const matchesTag = typeof window.matchesActiveTag === "function" 
      ? window.matchesActiveTag(post.tags) 
      : true;

    const matchesSearch = 
      (post.sno?.toLowerCase().includes(searchTerm) ?? false) ||
      (post.title?.toLowerCase().includes(searchTerm) ?? false) || 
      (post.excerpt?.toLowerCase().includes(searchTerm) ?? false) ||
      (post.quesRef?.toLowerCase().includes(searchTerm) ?? false) ||
      (Array.isArray(post.tags) && post.tags.some(t => t.toLowerCase().includes(searchTerm)));

    return matchesTag && matchesSearch;
  });

  renderPostCards(filtered);
};

// 12. Event Listeners & Initialization
if (searchInput) {
  searchInput.addEventListener("input", window.filterPosts);
}

document.addEventListener("click", (e) => {
  if (e.target && e.target.classList.contains("archive-tab-btn")) {
    const mode = e.target.getAttribute("data-view");
    currentArchiveSubView = mode;

    document.querySelectorAll(".archive-tab-btn").forEach(btn => btn.classList.remove("active"));
    e.target.classList.add("active");

    renderArchive(allPosts, mode);
  }
});

window.addEventListener("hashchange", handleRoute);

document.addEventListener("DOMContentLoaded", () => {
  loadPostsData();
});
