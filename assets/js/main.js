/**
 * Main Application Module
 * File: assets/js/main.js
 */

// 1. Declare allPosts globally at the very top of main.js
// Global state
let allPosts = [];

async function loadPostsData() {
  try {
    const response = await fetch("./posts.json");
    if (!response.ok) throw new Error("Failed to fetch posts.json");
    
    // Populate both references so legacy calls to window.postsData don't break
    allPosts = await response.json();
    window.postsData = allPosts; 
    
    // Trigger route handling once data is loaded
    handleRoute();
  } catch (err) {
    console.error("Error loading posts data:", err);
  }
}


// 2. DOM Selectors
const homeView = document.getElementById("homeView");
const postView = document.getElementById("postView");
const postsContainer = document.getElementById("postsContainer");
const articleContainer = document.getElementById("articleContainer");
const searchInput = document.getElementById("searchInput");

// 3. Fetch Posts Data from External JSON
async function loadPostsData() {
  try {
    const response = await fetch("./assets/data/posts.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    window.postsData = await response.json();

    // Render cards and evaluate routing after data is loaded
    window.filterPosts();
    handleRoute();
  } catch (error) {
    console.error("Error loading posts.json:", error);
    if (postsContainer) {
      postsContainer.innerHTML = "<p>Error loading articles. Please try again later.</p>";
    }
  }
}

// 4. Render Post Cards Grid (Home View)
function renderPostCards(postsToRender) {
  if (!postsContainer) return;

  postsContainer.innerHTML = "";

  if (postsToRender.length === 0) {
    postsContainer.innerHTML = "<p>No articles found matching your criteria.</p>";
    return;
  }

  // Sort pinned posts first, then by date (newest first)
  const sortedPosts = [...postsToRender].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.date || 0) - new Date(a.date || 0);
  });

  sortedPosts.forEach(post => {
    const card = document.createElement("article");
    card.className = "card";

    // Pinned Badge HTML
  const pinnedHTML = post.pinned 
    ? `<span class="pinned-badge" title="Pinned Post">📌</span>` 
    : "";

    // Build tag badges
    const tagsHTML = Array.isArray(post.tags)
      ? post.tags.map(t => `<span class="badge">${t.replace(/[-–—]/g, ' ')}</span>`).join(" ")
      : "";

    card.innerHTML = `
      <div class="card-header">
        <div class="tags-wrapper">${pinnedHTML}${tagsHTML}</div>
        <span class="read-time">${post.readTime || ""}</span>
      </div>
      <h2><a href="#${post.id}">${post.title}</a></h2>
      <p class="date">${post.date || ""}</p>
      <p class="excerpt">${post.excerpt || ""}</p>
      <a href="#${post.id}" class="read-more">Read Article &rarr;</a>
    `;
    postsContainer.appendChild(card);
  });
}

// 5. Render Single Article View & Trigger KaTeX
async function renderSinglePost(postId) {
  // 1. Ensure allPosts is loaded
  if (!allPosts || allPosts.length === 0) {
    try {
      const res = await fetch("./assets/data/posts.json");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load posts.json`);
      }
      allPosts = await res.json();
      window.postsData = allPosts;
    } catch (e) {
      console.error("Fetch Error:", e);
      document.getElementById("articleContainer").innerHTML = 
        `<p style="color:red;">Error loading posts index: ${e.message}</p>`;
      return;
    }
  }

  // 2. Search for the post
  const post = allPosts.find(p => p.id === postId);
  const articleContainer = document.getElementById("articleContainer");

  if (!post) {
    articleContainer.innerHTML = `<p>Error: Post ID "${postId}" not found in posts.json.</p>`;
    return;
  }

  // 3. Fetch and render the Markdown post content
  try {
    const response = await fetch(post.file);
    if (!response.ok) throw new Error(`HTTP ${response.status} - File not found at ${post.file}`);
    
    const markdownText = await response.text();
    const parsedHTML = marked.parse(markdownText);

    articleContainer.innerHTML = `
      <a href="#home" class="back-link">&larr; Back to posts</a>
      <h1>${post.title}</h1>
      <p class="date">${post.date} • ${post.readTime}</p>
      <div class="post-body">${parsedHTML}</div>
    `;

    if (window.renderMathInElement) {
      renderMathInElement(articleContainer, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ]
      });
    }
  } catch (err) {
    console.error("Render Error:", err);
    articleContainer.innerHTML = `<p style="color: red;">Failed to load article: ${err.message}</p>`;
  }
}

function triggerKaTeX(container) {
  if (typeof renderMathInElement === "function") {
    renderMathInElement(container, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false,
      errorColor: "#cc0000"
    });
  } else {
    // If KaTeX script hasn't loaded yet, wait for window load
    window.addEventListener("load", () => {
      if (typeof renderMathInElement === "function") {
        renderMathInElement(container, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false,
          errorColor: "#cc0000"
        });
      }
    });
  }
}

// 6. Hash Router
function handleRoute() {
  const hash = window.location.hash.substring(1); // extracts "my-first-post"

  if (hash && hash !== "home") {
    homeView.style.display = "none";
    postView.style.display = "block";
    renderSinglePost(hash);
    window.scrollTo(0, 0);
  } else {
    postView.style.display = "none";
    homeView.style.display = "block";
  }
}

// 7. Search and Tag Filter Logic (Attached to window for tags.js access)
window.filterPosts = function filterPosts() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";

  const filtered = window.postsData.filter(post => {
    // Check tag filter via tags.js
    const matchesTag = typeof window.matchesActiveTag === "function" 
      ? window.matchesActiveTag(post.tags) 
      : true;

    // Check search input query
    const matchesSearch = 
      (post.title?.toLowerCase().includes(searchTerm) ?? false) || 
      (post.excerpt?.toLowerCase().includes(searchTerm) ?? false) ||
      (Array.isArray(post.tags) && post.tags.some(t => t.toLowerCase().includes(searchTerm)));

    return matchesTag && matchesSearch;
  });

  renderPostCards(filtered);
};

// 8. Event Listeners & Initialization
// Bind search input immediately if element exists
if (searchInput) {
  searchInput.addEventListener("input", window.filterPosts);
}

// Handle hash changes when user navigates back/forward
window.addEventListener("hashchange", handleRoute);

// Load posts first; handleRoute is called internally once fetching completes
document.addEventListener("DOMContentLoaded", () => {
  loadPostsData();
});
