
/* =========================================================
   ConnectHub - Social Networking Application
   File: script.js
   Features: Posts, Likes, Comments, Search, Stories,
   Dark Mode, Notifications, Share, Bookmarks, and Settings
   ========================================================= */

"use strict";

/* =========================================================
   1. APPLICATION CONFIGURATION
   ========================================================= */

const ConnectHub = {
    name: "ConnectHub",
    version: "1.0.0",
    storageKey: "connecthub_data",
    themeKey: "connecthub_theme",
    maxPostLength: 2000,
    maxCommentLength: 500
};

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

const createElement = (tag, className = "", text = "") => {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text) {
        element.textContent = text;
    }

    return element;
};

/* =========================================================
   2. APPLICATION STATE
   ========================================================= */

const defaultState = {
    currentUser: {
        id: "user-001",
        name: "Dhilip Kumar",
        username: "dhilip",
        avatar: "https://i.pravatar.cc/150?img=12",
        bio: "Learning, building, and connecting every day."
    },

    posts: [
        {
            id: "post-101",
            author: "Alex Morgan",
            username: "alexmorgan",
            avatar: "https://i.pravatar.cc/150?img=11",
            time: "15 minutes ago",
            text: "Welcome to ConnectHub! 🎉 A place to share ideas, connect with friends, and discover something new every day.",
            image: "",
            likes: 128,
            comments: [
                {
                    id: "comment-1",
                    author: "Jamie Lee",
                    text: "This looks amazing! 👏"
                }
            ],
            liked: false,
            bookmarked: false,
            visibility: "public"
        },

        {
            id: "post-102",
            author: "Sophia Williams",
            username: "sophiaw",
            avatar: "https://i.pravatar.cc/150?img=47",
            time: "1 hour ago",
            text: "Small progress is still progress. Keep learning, keep building, and never stop improving. 🚀",
            image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80",
            likes: 246,
            comments: [],
            liked: false,
            bookmarked: false,
            visibility: "public"
        },

        {
            id: "post-103",
            author: "Ryan Cooper",
            username: "ryancooper",
            avatar: "https://i.pravatar.cc/150?img=68",
            time: "3 hours ago",
            text: "What is one programming language you would recommend to a beginner in 2026? 💻",
            image: "",
            likes: 87,
            comments: [
                {
                    id: "comment-2",
                    author: "Taylor",
                    text: "JavaScript is a great choice!"
                }
            ],
            liked: false,
            bookmarked: false,
            visibility: "public"
        }
    ],

    stories: [
        {
            id: "story-1",
            name: "Your Story",
            avatar: "https://i.pravatar.cc/150?img=12",
            isOwn: true
        },
        {
            id: "story-2",
            name: "Sophia",
            avatar: "https://i.pravatar.cc/150?img=47"
        },
        {
            id: "story-3",
            name: "Alex",
            avatar: "https://i.pravatar.cc/150?img=11"
        },
        {
            id: "story-4",
            name: "Ryan",
            avatar: "https://i.pravatar.cc/150?img=68"
        },
        {
            id: "story-5",
            name: "Jamie",
            avatar: "https://i.pravatar.cc/150?img=44"
        }
    ],

    friends: [
        {
            id: "friend-1",
            name: "Sophia Williams",
            username: "sophiaw",
            avatar: "https://i.pravatar.cc/150?img=47",
            online: true
        },
        {
            id: "friend-2",
            name: "Alex Morgan",
            username: "alexmorgan",
            avatar: "https://i.pravatar.cc/150?img=11",
            online: true
        },
        {
            id: "friend-3",
            name: "Ryan Cooper",
            username: "ryancooper",
            avatar: "https://i.pravatar.cc/150?img=68",
            online: false
        },
        {
            id: "friend-4",
            name: "Jamie Lee",
            username: "jamielee",
            avatar: "https://i.pravatar.cc/150?img=44",
            online: true
        }
    ],

    notifications: [],
    following: [],
    activeFilter: "all"
};

let state = loadState();
let activeCommentPost = null;
let activeStory = null;
let searchTimeout = null;

/* =========================================================
   3. LOCAL STORAGE
   ========================================================= */

function loadState() {
    try {
        const saved = localStorage.getItem(ConnectHub.storageKey);

        if (!saved) {
            return structuredClone(defaultState);
        }

        const parsed = JSON.parse(saved);

        return {
            ...structuredClone(defaultState),
            ...parsed,
            currentUser: {
                ...defaultState.currentUser,
                ...(parsed.currentUser || {})
            },
            posts: Array.isArray(parsed.posts)
                ? parsed.posts
                : structuredClone(defaultState.posts),
            stories: Array.isArray(parsed.stories)
                ? parsed.stories
                : structuredClone(defaultState.stories),
            friends: Array.isArray(parsed.friends)
                ? parsed.friends
                : structuredClone(defaultState.friends),
            notifications: Array.isArray(parsed.notifications)
                ? parsed.notifications
                : [],
            following: Array.isArray(parsed.following)
                ? parsed.following
                : []
        };
    } catch (error) {
        console.warn("Could not load saved data:", error);
        return structuredClone(defaultState);
    }
}

function saveState() {
    try {
        localStorage.setItem(
            ConnectHub.storageKey,
            JSON.stringify(state)
        );
    } catch (error) {
        console.error("Could not save ConnectHub data:", error);
        showToast("Unable to save changes in this browser.", "error");
    }
}

function resetDemoData() {
    const confirmed = window.confirm(
        "Reset ConnectHub to its original demo data?"
    );

    if (!confirmed) return;

    state = structuredClone(defaultState);
    saveState();
    renderPosts();
    renderFriends();
    renderStories();
    showToast("Demo data has been reset.");
}

/* =========================================================
   4. SAFE TEXT AND HTML HELPERS
   ========================================================= */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function safeImageURL(url) {
    try {
        const parsed = new URL(url, window.location.href);

        if (
            parsed.protocol === "https:" ||
            parsed.protocol === "http:"
        ) {
            return parsed.href;
        }
    } catch (error) {
        console.warn("Invalid image URL.");
    }

    return "";
}

function formatCount(number) {
    const count = Number(number) || 0;

    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + "M";
    }

    if (count >= 1000) {
        return (count / 1000).toFixed(1) + "K";
    }

    return String(count);
}

function createAvatar(name, image, className = "avatar") {
    const safeName = escapeHTML(name || "User");
    const safeImage = safeImageURL(image);

    return `
        <img
            class="${className}"
            src="${escapeHTML(safeImage)}"
            alt="${safeName}"
            loading="lazy"
            onerror="this.onerror=null;this.src='https://i.pravatar.cc/150?img=1';"
        >
    `;
}

/* =========================================================
   5. TOAST NOTIFICATIONS
   ========================================================= */

function showToast(message, type = "success") {
    let container = $("#toast-container");

    if (!container) {
        container = createElement("div", "toast-container");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    const toast = createElement("div", `toast toast-${type}`);
    toast.setAttribute("role", "status");
    toast.textContent = message;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    window.setTimeout(() => {
        toast.classList.remove("show");

        window.setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2800);
}

/* =========================================================
   6. POST RENDERING
   ========================================================= */

function renderPosts() {
    const feed = $("#posts-feed");

    if (!feed) {
        console.warn(
            "Add an element with id='posts-feed' to index.html."
        );
        return;
    }

    const posts = getFilteredPosts();

    feed.replaceChildren();

    if (posts.length === 0) {
        const empty = createElement("div", "empty-state");
        empty.innerHTML = `
            <div class="empty-state-icon">📝</div>
            <h3>No posts found</h3>
            <p>Try another search or create a new post.</p>
        `;
        feed.appendChild(empty);
        return;
    }

    posts.forEach(post => {
        feed.appendChild(buildPostElement(post));
    });

    updatePostCounters();
}

function getFilteredPosts() {
    let posts = [...state.posts];
    const searchInput = $("#search-input");
    const query = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    if (query) {
        posts = posts.filter(post => {
            const searchableText = [
                post.author,
                post.username,
                post.text
            ].join(" ").toLowerCase();

            return searchableText.includes(query);
        });
    }

    if (state.activeFilter === "liked") {
        posts = posts.filter(post => post.liked);
    }

    if (state.activeFilter === "bookmarked") {
        posts = posts.filter(post => post.bookmarked);
    }

    if (state.activeFilter === "following") {
        posts = posts.filter(post =>
            state.following.includes(post.username)
        );
    }

    return posts;
}

function buildPostElement(post) {
    const article = createElement("article", "post-card");
    article.dataset.postId = post.id;

    const isLiked = Boolean(post.liked);
    const isBookmarked = Boolean(post.bookmarked);
    const commentCount = Array.isArray(post.comments)
        ? post.comments.length
        : 0;

    const safeText = escapeHTML(post.text).replace(/\n/g, "<br>");
    const imageURL = safeImageURL(post.image);

    article.innerHTML = `
        <div class="post-header">
            <div class="post-author">
                ${createAvatar(post.author, post.avatar)}
                <div class="post-author-info">
                    <h3>${escapeHTML(post.author)}</h3>
                    <span>
                        @${escapeHTML(post.username)}
                        · ${escapeHTML(post.time || "Just now")}
                    </span>
                </div>
            </div>

            <button
                class="post-menu-btn"
                type="button"
                data-action="post-menu"
                data-post-id="${escapeHTML(post.id)}"
                aria-label="Post options"
                title="Post options"
            >⋯</button>
        </div>

        <div class="post-content">
            <p>${safeText}</p>

            ${
                imageURL
                    ? `
                        <img
                            class="post-image"
                            src="${escapeHTML(imageURL)}"
                            alt="Image shared by ${escapeHTML(post.author)}"
                            loading="lazy"
                        >
                    `
                    : ""
            }
        </div>

        <div class="post-stats">
            <span class="like-summary">
                ❤️ ${formatCount(post.likes)} likes
            </span>

            <button
                class="comment-count"
                type="button"
                data-action="comments"
                data-post-id="${escapeHTML(post.id)}"
            >
                ${commentCount} comments
            </button>
        </div>

        <div class="post-actions">
            <button
                class="post-action ${isLiked ? "active" : ""}"
                type="button"
                data-action="like"
                data-post-id="${escapeHTML(post.id)}"
                aria-pressed="${isLiked}"
            >
                ${isLiked ? "❤️ Liked" : "♡ Like"}
            </button>

            <button
                class="post-action"
                type="button"
                data-action="comments"
                data-post-id="${escapeHTML(post.id)}"
            >
                💬 Comment
            </button>

            <button
                class="post-action"
                type="button"
                data-action="share"
                data-post-id="${escapeHTML(post.id)}"
            >
                ↗ Share
            </button>

            <button
                class="post-action ${isBookmarked ? "active" : ""}"
                type="button"
                data-action="bookmark"
                data-post-id="${escapeHTML(post.id)}"
                aria-pressed="${isBookmarked}"
            >
                ${isBookmarked ? "🔖 Saved" : "🔖 Save"}
            </button>
        </div>
    `;

    return article;
}

/* =========================================================
   7. CREATE A NEW POST
   ========================================================= */

function createPost() {
    const input = $("#post-text");
    const imageInput = $("#post-image-url");

    if (!input) {
        showToast("Post input was not found.", "error");
        return;
    }

    const text = input.value.trim();
    const image = imageInput ? imageInput.value.trim() : "";

    if (!text && !image) {
        showToast("Write something or add an image first.", "error");
        input.focus();
        return;
    }

    if (text.length > ConnectHub.maxPostLength) {
        showToast(
            `Posts can contain up to ${ConnectHub.maxPostLength} characters.`,
            "error"
        );
        return;
    }

    if (image && !safeImageURL(image)) {
        showToast("Please enter a valid HTTP or HTTPS image URL.", "error");
        return;
    }

    const user = state.currentUser;

    const newPost = {
        id: createID("post"),
        author: user.name,
        username: user.username,
        avatar: user.avatar,
        time: "Just now",
        text,
        image,
        likes: 0,
        comments: [],
        liked: false,
        bookmarked: false,
        visibility: "public"
    };

    state.posts.unshift(newPost);

    input.value = "";

    if (imageInput) {
        imageInput.value = "";
    }

    updateCharacterCount();
    saveState();
    renderPosts();

    showToast("Your post was published! 🎉");

    const feed = $("#posts-feed");

    if (feed) {
        feed.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

function setupCreatePost() {
    const publishButton = $("#publish-post");
    const textInput = $("#post-text");
    const imageInput = $("#post-image-url");

    if (publishButton) {
        publishButton.addEventListener("click", createPost);
    }

    if (textInput) {
        textInput.addEventListener("input", updateCharacterCount);

        textInput.addEventListener("keydown", event => {
            if (
                event.key === "Enter" &&
                (event.ctrlKey || event.metaKey)
            ) {
                event.preventDefault();
                createPost();
            }
        });
    }

    if (imageInput) {
        imageInput.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                createPost();
            }
        });
    }
}

function updateCharacterCount() {
    const input = $("#post-text");
    const counter = $("#character-count");

    if (!input || !counter) return;

    const length = input.value.length;

    counter.textContent =
        `${length}/${ConnectHub.maxPostLength}`;

    counter.classList.toggle(
        "limit-reached",
        length > ConnectHub.maxPostLength
    );
}

/* =========================================================
   8. LIKE AND UNLIKE POSTS
   ========================================================= */

function toggleLike(postId) {
    const post = findPost(postId);

    if (!post) return;

    post.liked = !post.liked;

    if (post.liked) {
        post.likes = Math.max(0, Number(post.likes) || 0) + 1;
        showToast("You liked this post ❤️");
    } else {
        post.likes = Math.max(0, (Number(post.likes) || 0) - 1);
        showToast("Like removed.");
    }

    saveState();
    renderPosts();
}

function updatePostCounters() {
    const totalPosts = $("#total-posts");
    const totalLikes = $("#total-likes");

    if (totalPosts) {
        totalPosts.textContent = state.posts.length;
    }

    if (totalLikes) {
        totalLikes.textContent = state.posts.reduce(
            (sum, post) => sum + (Number(post.likes) || 0),
            0
        );
    }
}

/* =========================================================
   9. COMMENTS
   ========================================================= */

function openComments(postId) {
    const post = findPost(postId);

    if (!post) return;

    activeCommentPost = postId;

    let modal = $("#comments-modal");

    if (!modal) {
        modal = createElement("div", "modal-overlay");
        modal.id = "comments-modal";

        modal.innerHTML = `
            <div
                class="modal-card comments-modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="comments-title"
            >
                <div class="modal-header">
                    <h2 id="comments-title">Comments</h2>
                    <button
                        type="button"
                        class="modal-close"
                        data-action="close-comments"
                        aria-label="Close comments"
                    >×</button>
                </div>

                <div id="comments-list" class="comments-list"></div>

                <form id="comment-form" class="comment-form">
                    <input
                        id="comment-input"
                        type="text"
                        maxlength="${ConnectHub.maxCommentLength}"
                        placeholder="Write a comment..."
                        autocomplete="off"
                        required
                    >

                    <button type="submit">Send</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        $("#comment-form", modal).addEventListener("submit", event => {
            event.preventDefault();
            addComment();
        });

        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeComments();
            }
        });
    }

    renderComments(post);
    modal.classList.add("visible");

    const input = $("#comment-input");
    if (input) input.focus();
}

function renderComments(post) {
    const list = $("#comments-list");

    if (!list) return;

    list.replaceChildren();

    if (!post.comments || post.comments.length === 0) {
        const empty = createElement(
            "p",
            "comments-empty",
            "No comments yet. Start the conversation!"
        );

        list.appendChild(empty);
        return;
    }

    post.comments.forEach(comment => {
        const item = createElement("div", "comment-item");

        item.innerHTML = `
            ${createAvatar(
                comment.author,
                comment.avatar || "https://i.pravatar.cc/150?img=12",
                "comment-avatar"
            )}

            <div class="comment-bubble">
                <strong>${escapeHTML(comment.author)}</strong>
                <p>${escapeHTML(comment.text)}</p>
            </div>
        `;

        list.appendChild(item);
    });
}

function addComment() {
    if (!activeCommentPost) return;

    const input = $("#comment-input");
    const text = input ? input.value.trim() : "";

    if (!text) {
        showToast("Please write a comment first.", "error");
        return;
    }

    if (text.length > ConnectHub.maxCommentLength) {
        showToast("Your comment is too long.", "error");
        return;
    }

    const post = findPost(activeCommentPost);

    if (!post) return;

    if (!Array.isArray(post.comments)) {
        post.comments = [];
    }

    post.comments.push({
        id: createID("comment"),
        author: state.currentUser.name,
        avatar: state.currentUser.avatar,
        text
    });

    input.value = "";

    saveState();
    renderComments(post);
    renderPosts();

    showToast("Comment added!");
}

function closeComments() {
    const modal = $("#comments-modal");

    if (modal) {
        modal.classList.remove("visible");
    }

    activeCommentPost = null;
}

/* =========================================================
   10. BOOKMARKS
   ========================================================= */

function toggleBookmark(postId) {
    const post = findPost(postId);

    if (!post) return;

    post.bookmarked = !post.bookmarked;

    saveState();
    renderPosts();

    showToast(
        post.bookmarked
            ? "Post saved to your bookmarks."
            : "Post removed from bookmarks."
    );
}

/* =========================================================
   11. SHARE POSTS
   ========================================================= */

async function sharePost(postId) {
    const post = findPost(postId);

    if (!post) return;

    const shareText =
        `${post.author} on ConnectHub: ${post.text}`;

    const shareData = {
        title: "ConnectHub",
        text: shareText,
        url: window.location.href
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            showToast("Share panel opened.");
        } else if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(shareText);
            showToast("Post text copied to clipboard.");
        } else {
            showToast("Sharing is not supported in this browser.", "error");
        }
    } catch (error) {
        if (error.name !== "AbortError") {
            console.error("Share failed:", error);
            showToast("Could not share this post.", "error");
        }
    }
}

/* =========================================================
   12. POST OPTIONS MENU
   ========================================================= */

function showPostMenu(postId) {
    const post = findPost(postId);

    if (!post) return;

    const choice = window.prompt(
        "Post options:\n" +
        "1. Copy post text\n" +
        "2. Save or unsave post\n" +
        "3. Delete your own post\n\n" +
        "Enter 1, 2, or 3:"
    );

    if (choice === "1") {
        copyText(post.text);
    } else if (choice === "2") {
        toggleBookmark(postId);
    } else if (choice === "3") {
        deletePost(postId);
    }
}

function deletePost(postId) {
    const post = findPost(postId);

    if (!post) return;

    if (post.username !== state.currentUser.username) {
        showToast(
            "You can only delete posts created by your profile.",
            "error"
        );
        return;
    }

    const confirmed = window.confirm(
        "Are you sure you want to delete this post?"
    );

    if (!confirmed) return;

    state.posts = state.posts.filter(item => item.id !== postId);

    saveState();
    renderPosts();

    showToast("Post deleted.");
}

/* =========================================================
   13. COPY TO CLIPBOARD
   ========================================================= */

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(String(text));
        showToast("Copied to clipboard!");
    } catch (error) {
        const textArea = createElement("textarea");
        textArea.value = String(text);
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";

        document.body.appendChild(textArea);
        textArea.select();

        const copied = document.execCommand("copy");
        textArea.remove();

        showToast(
            copied ? "Copied to clipboard!" : "Unable to copy text.",
            copied ? "success" : "error"
        );
    }
}

/* =========================================================
   14. SEARCH
   ========================================================= */

function setupSearch() {
    const searchInput = $("#search-input");

    if (!searchInput) return;

    searchInput.addEventListener("input", () => {
        window.clearTimeout(searchTimeout);

        searchTimeout = window.setTimeout(() => {
            renderPosts();
        }, 150);
    });

    searchInput.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            searchInput.value = "";
            renderPosts();
            searchInput.blur();
        }

        if (event.key === "Enter") {
            renderPosts();
            const feed = $("#posts-feed");

            if (feed) {
                feed.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        }
    });
}

/* =========================================================
   15. FILTERS
   ========================================================= */

function setFilter(filter) {
    const validFilters = [
        "all",
        "liked",
        "bookmarked",
        "following"
    ];

    if (!validFilters.includes(filter)) {
        filter = "all";
    }

    state.activeFilter = filter;

    $$(".filter-btn, [data-filter]").forEach(button => {
        const active = button.dataset.filter === filter;

        button.classList.toggle("active", active);

        if (button.hasAttribute("aria-pressed")) {
            button.setAttribute("aria-pressed", String(active));
        }
    });

    renderPosts();
}

function setupFilters() {
    $$("[data-filter]").forEach(button => {
        button.addEventListener("click", () => {
            setFilter(button.dataset.filter);
        });
    });
}

/* =========================================================
   16. DARK MODE
   ========================================================= */

function applyTheme(theme) {
    const isDark = theme === "dark";

    document.body.classList.toggle("dark-theme", isDark);

    const themeButton = $("#theme-toggle");

    if (themeButton) {
        themeButton.textContent = isDark
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";

        themeButton.setAttribute(
            "aria-pressed",
            String(isDark)
        );
    }

    try {
        localStorage.setItem(ConnectHub.themeKey, theme);
    } catch (error) {
        console.warn("Theme preference could not be saved.");
    }
}

function toggleTheme() {
    const isDark = document.body.classList.contains("dark-theme");

    applyTheme(isDark ? "light" : "dark");

    showToast(
        isDark ? "Light theme enabled." : "Dark theme enabled."
    );
}

function setupTheme() {
    let savedTheme = "light";

    try {
        savedTheme = localStorage.getItem(ConnectHub.themeKey) || "light";
    } catch (error) {
        console.warn("Could not read theme preference.");
    }

    applyTheme(savedTheme);

    const themeButton = $("#theme-toggle");

    if (themeButton) {
        themeButton.addEventListener("click", toggleTheme);
    }
}

/* =========================================================
   17. STORIES
   ========================================================= */

function renderStories() {
    const container = $("#stories-container");

    if (!container) return;

    container.replaceChildren();

    state.stories.forEach(story => {
        const button = createElement(
            "button",
            `story-item ${story.isOwn ? "own-story" : ""}`
        );

        button.type = "button";
        button.dataset.storyId = story.id;

        button.innerHTML = `
            <span class="story-ring">
                ${createAvatar(story.name, story.avatar, "story-avatar")}
                ${
                    story.isOwn
                        ? '<span class="story-add-icon">+</span>'
                        : ""
                }
            </span>

            <span class="story-name">
                ${escapeHTML(story.name)}
            </span>
        `;

        button.addEventListener("click", () => {
            openStory(story.id);
        });

        container.appendChild(button);
    });
}

function openStory(storyId) {
    const story = state.stories.find(item => item.id === storyId);

    if (!story) return;

    activeStory = storyId;

    if (story.isOwn) {
        const text = window.prompt(
            "Write a short story (text only):"
        );

        if (text && text.trim()) {
            addStory(text.trim());
        }

        return;
    }

    let modal = $("#story-modal");

    if (!modal) {
        modal = createElement("div", "modal-overlay");
        modal.id = "story-modal";

        modal.innerHTML = `
            <div class="modal-card story-modal-card">
                <button
                    class="modal-close story-close"
                    type="button"
                    data-action="close-story"
                    aria-label="Close story"
                >×</button>

                <div id="story-viewer"></div>

                <button
                    class="story-next"
                    type="button"
                    data-action="next-story"
                >Next story →</button>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeStory();
            }
        });
    }

    const viewer = $("#story-viewer");

    if (viewer) {
        viewer.innerHTML = `
            ${createAvatar(story.name, story.avatar, "story-viewer-avatar")}
            <h2>${escapeHTML(story.name)}</h2>
            <p>Welcome to ${escapeHTML(story.name)}'s story!</p>
            <p class="story-placeholder">
                This is a demo story. Real user stories need a backend.
            </p>
        `;
    }

    modal.classList.add("visible");
}

function addStory(text) {
    const user = state.currentUser;

    const ownStory = state.stories.find(story => story.isOwn);

    if (ownStory) {
        ownStory.text = text;
    } else {
        state.stories.unshift({
            id: createID("story"),
            name: "Your Story",
            avatar: user.avatar,
            isOwn: true,
            text
        });
    }

    saveState();
    renderStories();

    showToast("Your story was added!");
}

function closeStory() {
    const modal = $("#story-modal");

    if (modal) {
        modal.classList.remove("visible");
    }

    activeStory = null;
}

function nextStory() {
    if (!activeStory) return;

    const currentIndex = state.stories.findIndex(
        story => story.id === activeStory
    );

    const next = state.stories[currentIndex + 1];

    if (next) {
        openStory(next.id);
    } else {
        closeStory();
        showToast("You have reached the end of the stories.");
    }
}

/* =========================================================
   18. FRIENDS AND ONLINE STATUS
   ========================================================= */

function renderFriends() {
    const container = $("#friends-list");

    if (!container) return;

    container.replaceChildren();

    state.friends.forEach(friend => {
        const item = createElement("div", "friend-item");

        item.innerHTML = `
            <div class="friend-avatar-wrap">
                ${createAvatar(friend.name, friend.avatar, "friend-avatar")}

                <span class="online-indicator ${
                    friend.online ? "online" : "offline"
                }"></span>
            </div>

            <div class="friend-info">
                <strong>${escapeHTML(friend.name)}</strong>
                <span>
                    ${friend.online ? "Online now" : "Offline"}
                </span>
            </div>

            <button
                type="button"
                class="friend-message-btn"
                data-action="message-friend"
                data-friend-id="${escapeHTML(friend.id)}"
                aria-label="Message ${escapeHTML(friend.name)}"
            >✉</button>
        `;

        container.appendChild(item);
    });
}

function messageFriend(friendId) {
    const friend = state.friends.find(
        item => item.id === friendId
    );

    if (!friend) return;

    showToast(
        `Messaging ${friend.name} requires a backend chat service.`,
        "info"
    );
}

/* =========================================================
   19. FOLLOW AND UNFOLLOW
   ========================================================= */

function toggleFollow(username) {
    if (!username) return;

    if (username === state.currentUser.username) {
        showToast("You cannot follow yourself.", "error");
        return;
    }

    const index = state.following.indexOf(username);

    if (index >= 0) {
        state.following.splice(index, 1);
        showToast(`Unfollowed @${username}`);
    } else {
        state.following.push(username);
        showToast(`You are now following @${username}`);
    }

    saveState();
    updateFollowingCount();
    renderPosts();
}

function updateFollowingCount() {
    const count = $("#following-count");

    if (count) {
        count.textContent = state.following.length;
    }
}

/* =========================================================
   20. NOTIFICATIONS
   ========================================================= */

function addNotification(message, type = "info") {
    const notification = {
        id: createID("notification"),
        message,
        type,
        time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        }),
        read: false
    };

    state.notifications.unshift(notification);

    if (state.notifications.length > 50) {
        state.notifications.length = 50;
    }

    saveState();
    renderNotifications();
}

function renderNotifications() {
    const container = $("#notifications-list");

    if (container) {
        container.replaceChildren();

        if (state.notifications.length === 0) {
            container.appendChild(
                createElement(
                    "p",
                    "notifications-empty",
                    "You're all caught up!"
                )
            );
        }

        state.notifications.forEach(notification => {
            const item = createElement(
                "div",
                `notification-item ${
                    notification.read ? "read" : "unread"
                }`
            );

            item.innerHTML = `
                <span class="notification-icon">
                    ${notification.type === "like" ? "❤️" : "🔔"}
                </span>

                <div class="notification-content">
                    <p>${escapeHTML(notification.message)}</p>
                    <small>${escapeHTML(notification.time)}</small>
                </div>
            `;

            container.appendChild(item);
        });
    }

    const unreadCount = state.notifications.filter(
        notification => !notification.read
    ).length;

    const badge = $("#notification-count");

    if (badge) {
        badge.textContent = unreadCount;
        badge.hidden = unreadCount === 0;
    }
}

function markNotificationsRead() {
    state.notifications.forEach(notification => {
        notification.read = true;
    });

    saveState();
    renderNotifications();
}

/* =========================================================
   21. NAVIGATION
   ========================================================= */

function navigateTo(section) {
    const destinations = {
        home: "#home-section",
        explore: "#explore-section",
        bookmarks: "#posts-feed",
        friends: "#friends-section",
        profile: "#profile-section"
    };

    const targetSelector = destinations[section];

    if (section === "bookmarks") {
        setFilter("bookmarked");
    } else if (section === "home") {
        setFilter("all");
    }

    if (targetSelector) {
        const target = $(targetSelector);

        if (target) {
            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        } else if (section !== "home" && section !== "bookmarks") {
            showToast(
                `Add ${targetSelector} to index.html to enable this section.`,
                "info"
            );
        }
    }

    $$(".sidebar-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.section === section
        );
    });
}

function setupNavigation() {
    $$("[data-section]").forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            navigateTo(link.dataset.section);
        });
    });
}

/* =========================================================
   22. PROFILE MENU
   ========================================================= */

function setupProfileMenu() {
    const button = $("#profile-menu-toggle");
    const menu = $("#profile-dropdown");

    if (!button || !menu) return;

    button.addEventListener("click", () => {
        const isOpen = menu.classList.toggle("visible");

        button.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", event => {
        if (
            !menu.contains(event.target) &&
            !button.contains(event.target)
        ) {
            menu.classList.remove("visible");
            button.setAttribute("aria-expanded", "false");
        }
    });
}

/* =========================================================
   23. PROFILE EDITING
   ========================================================= */

function editProfile() {
    const current = state.currentUser;

    const name = window.prompt(
        "Enter your display name:",
        current.name
    );

    if (name === null) return;

    const cleanName = name.trim();

    if (!cleanName) {
        showToast("Name cannot be empty.", "error");
        return;
    }

    if (cleanName.length > 60) {
        showToast("Name is too long.", "error");
        return;
    }

    const bio = window.prompt(
        "Enter your profile bio:",
        current.bio || ""
    );

    current.name = cleanName;

    if (bio !== null) {
        current.bio = bio.trim().slice(0, 160);
    }

    state.posts.forEach(post => {
        if (post.username === current.username) {
            post.author = current.name;
            post.avatar = current.avatar;
        }
    });

    saveState();
    updateProfileDisplay();
    renderPosts();

    showToast("Profile updated!");
}

function updateProfileDisplay() {
    const user = state.currentUser;

    const nameElements = $$("[data-user-name]");
    const usernameElements = $$("[data-user-username]");
    const bioElements = $$("[data-user-bio]");
    const avatarElements = $$("[data-user-avatar]");

    nameElements.forEach(element => {
        element.textContent = user.name;
    });

    usernameElements.forEach(element => {
        element.textContent = "@" + user.username;
    });

    bioElements.forEach(element => {
        element.textContent = user.bio || "";
    });

    avatarElements.forEach(element => {
        if (element.tagName === "IMG") {
            element.src = safeImageURL(user.avatar);
            element.alt = user.name;
        }
    });

    const profilePosts = $("#profile-post-count");

    if (profilePosts) {
        profilePosts.textContent = state.posts.filter(
            post => post.username === user.username
        ).length;
    }

    updateFollowingCount();
}

/* =========================================================
   24. SETTINGS
   ========================================================= */

function openSettings() {
    let modal = $("#settings-modal");

    if (!modal) {
        modal = createElement("div", "modal-overlay");
        modal.id = "settings-modal";

        modal.innerHTML = `
            <div
                class="modal-card settings-modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-title"
            >
                <div class="modal-header">
                    <h2 id="settings-title">Settings</h2>
                    <button
                        type="button"
                        class="modal-close"
                        data-action="close-settings"
                        aria-label="Close settings"
                    >×</button>
                </div>

                <div class="settings-content">
                    <button
                        type="button"
                        class="settings-option"
                        data-action="toggle-theme"
                    >
                        🌙 Toggle dark mode
                    </button>

                    <button
                        type="button"
                        class="settings-option"
                        data-action="edit-profile"
                    >
                        👤 Edit profile
                    </button>

                    <button
                        type="button"
                        class="settings-option"
                        data-action="reset-data"
                    >
                        🔄 Reset demo data
                    </button>

                    <p class="settings-note">
                        ConnectHub demo data is stored in this browser.
                        This demo does not use a real server or account system.
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener("click", event => {
            if (event.target === modal) {
                modal.classList.remove("visible");
            }
        });
    }

    modal.classList.add("visible");
}

function closeSettings() {
    const modal = $("#settings-modal");

    if (modal) {
        modal.classList.remove("visible");
    }
}

/* =========================================================
   25. MOBILE SIDEBAR
   ========================================================= */

function setupMobileMenu() {
    const toggle = $("#mobile-menu-toggle");
    const sidebar = $(".sidebar");

    if (!toggle || !sidebar) return;

    toggle.addEventListener("click", () => {
        const open = sidebar.classList.toggle("mobile-open");

        toggle.setAttribute("aria-expanded", String(open));
    });

    document.addEventListener("click", event => {
        if (
            !sidebar.contains(event.target) &&
            !toggle.contains(event.target)
        ) {
            sidebar.classList.remove("mobile-open");
            toggle.setAttribute("aria-expanded", "false");
        }
    });
}

/* =========================================================
   26. KEYBOARD ACCESSIBILITY
   ========================================================= */

function setupKeyboardShortcuts() {
    document.addEventListener("keydown", event => {
        const target = event.target;

        const typing =
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target?.isContentEditable;

        if (event.key === "Escape") {
            closeComments();
            closeStory();
            closeSettings();
        }

        if (
            !typing &&
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {
            event.preventDefault();

            const search = $("#search-input");

            if (search) search.focus();
        }

        if (
            !typing &&
            event.key.toLowerCase() === "n"
        ) {
            const input = $("#post-text");

            if (input) input.focus();
        }
    });
}

/* =========================================================
   27. EVENT DELEGATION
   ========================================================= */

function setupGlobalActions() {
    document.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");

        if (!button) return;

        const action = button.dataset.action;
        const postId = button.dataset.postId;

        switch (action) {
            case "like":
                toggleLike(postId);
                break;

            case "comments":
                openComments(postId);
                break;

            case "share":
                sharePost(postId);
                break;

            case "bookmark":
                toggleBookmark(postId);
                break;

            case "post-menu":
                showPostMenu(postId);
                break;

            case "close-comments":
                closeComments();
                break;

            case "close-story":
                closeStory();
                break;

            case "next-story":
                nextStory();
                break;

            case "close-settings":
                closeSettings();
                break;

            case "toggle-theme":
                toggleTheme();
                break;

            case "edit-profile":
                editProfile();
                break;

            case "reset-data":
                resetDemoData();
                break;

            case "open-settings":
                openSettings();
                break;

            case "edit-profile-open":
                editProfile();
                break;

            case "message-friend":
                messageFriend(button.dataset.friendId);
                break;

            case "mark-notifications-read":
                markNotificationsRead();
                break;

            case "follow":
                toggleFollow(button.dataset.username);
                break;

            default:
                break;
        }
    });
}

/* =========================================================
   28. CREATE UNIQUE IDS
   ========================================================= */

function createID(prefix = "item") {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return `${prefix}-${window.crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;
}

/* =========================================================
   29. OPTIONAL DEMO ACTIONS
   ========================================================= */

function setupDemoActions() {
    const notificationButton = $("#notifications-toggle");
    const notificationPanel = $("#notifications-panel");

    if (notificationButton && notificationPanel) {
        notificationButton.addEventListener("click", () => {
            const open = notificationPanel.classList.toggle("visible");

            notificationButton.setAttribute(
                "aria-expanded",
                String(open)
            );

            if (open) {
                markNotificationsRead();
            }
        });
    }

    const createStoryButton = $("#create-story");

    if (createStoryButton) {
        createStoryButton.addEventListener("click", () => {
            const ownStory = state.stories.find(story => story.isOwn);

            if (ownStory) {
                openStory(ownStory.id);
            } else {
                addStory("Hello from ConnectHub!");
            }
        });
    }

    const editProfileButton = $("#edit-profile-button");

    if (editProfileButton) {
        editProfileButton.addEventListener("click", editProfile);
    }

    const settingsButton = $("#settings-button");

    if (settingsButton) {
        settingsButton.addEventListener("click", openSettings);
    }
}

/* =========================================================
   30. INITIALIZE THE APPLICATION
   ========================================================= */

function initializeConnectHub() {
    console.log(
        `${ConnectHub.name} v${ConnectHub.version} initializing...`
    );

    setupCreatePost();
    setupSearch();
    setupFilters();
    setupTheme();
    setupNavigation();
    setupProfileMenu();
    setupMobileMenu();
    setupKeyboardShortcuts();
    setupGlobalActions();
    setupDemoActions();

    renderPosts();
    renderStories();
    renderFriends();
    renderNotifications();
    updateProfileDisplay();
    updateCharacterCount();

    console.log("ConnectHub is ready!");
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeConnectHub,
        { once: true }
    );
} else {
    initializeConnectHub();
}

/* =========================================================
   END OF CONNECTHUB SCRIPT
   ========================================================= */
