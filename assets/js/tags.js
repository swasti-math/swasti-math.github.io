/**
 * Tag Manager & Scrolling Marquee System (Single Selection)
 * File: assets/js/tags.js
 */

// Global State
window.activeTag = "all";
window.tagsMasterList = [];

/**
 * Fetches master tags from tags.json and builds the tag filter marquee
 */
async function initTagSystem() {
  const tagContainer = document.getElementById("tagFilters");
  if (!tagContainer) return;

  try {
    const response = await fetch("assets/data/tags.json");
    if (!response.ok) throw new Error("Failed to load tags.json");

    window.tagsMasterList = await response.json();
    tagContainer.innerHTML = "";

    // 1. Create default "All" button
    const allBtn = document.createElement("button");
    allBtn.className = "tag-btn active";
    allBtn.setAttribute("data-filter", "all");
    allBtn.textContent = "All";
    tagContainer.appendChild(allBtn);

    // 2. Build tag buttons from tags.json
    window.tagsMasterList.forEach(tag => {
      const btn = document.createElement("button");
      btn.className = "tag-btn";
      btn.setAttribute("data-filter", tag.id);
      btn.textContent = tag.label;
      tagContainer.appendChild(btn);
    });

    // 3. Duplicate buttons inside the marquee to create a smooth infinite scroll loop
    const clonedButtons = tagContainer.innerHTML;
    tagContainer.insertAdjacentHTML("beforeend", clonedButtons);

    // 4. Attach click delegation listener
    attachTagEventListeners(tagContainer);

  } catch (error) {
    console.error("Error initializing tags system:", error);
  }
}

/**
 * Handles single-tag click selection and state synchronization
 */
function attachTagEventListeners(tagContainer) {
  tagContainer.addEventListener("click", (e) => {
    if (!e.target.classList.contains("tag-btn")) return;

    const clickedFilter = e.target.getAttribute("data-filter");
    const allButtons = tagContainer.querySelectorAll(".tag-btn");

    // Toggle logic: Clicking "all" or the currently active tag resets filter to "all"
    if (clickedFilter === "all" || window.activeTag === clickedFilter) {
      window.activeTag = "all";
    } else {
      window.activeTag = clickedFilter;
    }

    // Update active class on both primary and cloned marquee buttons
    allButtons.forEach(btn => {
      const btnFilter = btn.getAttribute("data-filter");
      if (btnFilter === window.activeTag) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Call global filter function in main.js
    if (typeof window.filterPosts === "function") {
      window.filterPosts();
    }
  });
}

/**
 * Utility Function: Checks if a post's tag array matches the active tag filter
 * @param {Array<string>} postTags 
 * @returns {boolean}
 */
window.matchesActiveTag = function(postTags) {
  if (!window.activeTag || window.activeTag === "all") return true;
  if (!Array.isArray(postTags)) return false;

  return postTags.some(tag => tag.toLowerCase() === window.activeTag.toLowerCase());
};

// Initialize system once DOM content is ready
document.addEventListener("DOMContentLoaded", initTagSystem);
