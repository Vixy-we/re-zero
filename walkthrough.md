# 🎌 Anime Previewer
### *The Ultimate Immersive Anime Library Manager*

![Banner](https://img.shields.io/badge/Status-Active-success) ![Version](https://img.shields.io/badge/Version-2.0-blue) ![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## 🌟 Overview

**Anime Previewer** isn't just a list—it's an **experience**. Designed for the modern otaku, it transforms your simple library into a vibrant, interactive journey through your **Library DNA** and 3D digital shelves. 

Powered by the massive **Jikan API (MyAnimeList)** and backed by **Supabase**, your collection is safe, synched, and beautifully visualized.

---

## 🚀 Key Features

### 1. 🏠 The Command Center (Dashboard)
The heart of your library. Clean, focused, and data-rich.
*   **📊 Smart Tabs:** Instantly toggle between **Watched** and **Plan to Watch**.
*   **🧠 Daily Inspiration:** A new anime quote greets you every day.
*   **✨ Intelligent Cards:** We prioritize **English Titles** (e.g., *"Attack on Titan"*) for readability, falling back to Romaji only when necessary.

### 2. 🌍 Global Explore & Discovery
Find your next obsession without ever opening a new tab.
*   **🔍 Jikan Powered:** Search the entire MAL database.
*   **⚡ Quick-Add System:**
    *   Hover over a card.
    *   Click the **Plus (+)** button.
    *   *Experience the satisfying green checkmark animation.* Done.
*   **🎨 Smart Filters:** Sort by **Popularity**, **Rank**, or **Season** to find hidden gems.

### 3. 🛠️ Robust Library Management
Take full control.
*   **📝 Details Dialog:** Click any card to edit:
    *   **Progress Tracking:** Update episode counts.
    *   **Rating:** Score from 1-10.
    *   **Notes:** Add your personal review.
    *   **Community Score:** Compare your taste with the world.
*   **🔄 Hard Refresh System:**
    *   *Missing data?* Hit the **Top-Left Refresh Button**.
    *   **Data Uplink:** Auto-fills missing metadata (English titles, formats) and **Auto-Tags** items based on their official genres.
    *   **Cleanup:** Deduplicates items while updating.


### 4. 🧬 Library DNA (Advanced Analytics)
Unlock deep insights into your viewing habits with a stunning, physics-based visualization.
*   **🫧 Organic Bubble Cloud:** Genres appear as floating, breathing bubbles. Larger bubbles indicate your most-popular categories.
*   **📊 Status Breakdown:** Hover any bubble to see a mini-progress bar and high-level stats (Watched vs. Plan to Watch).
*   **🛡️ Collision Physics:** Bubbles intelligently space themselves to prevent overlap, ensuring a clean and readable map.
*   **🖱️ Interactive Discovery:** Drag and drop bubbles or watch them pulse with life in their idle state.

### 5. 🧪 Suggestions (Beta)
The new **Recommendation Engine** that builds a personalized recipe for your next watch.
*   **Draggable Interface:**
    *   **Like Bucket (Green):** Drag favorite anime here to find similar shows.
    *   **Dislike Bucket (Red):** Drag anime you didn't enjoy here to avoid similar recommendations.
*   **Smart Filtering:**
    *   **Format:** Filter by TV, Movie, OVA, etc.
    *   **Genres:** Click to "Like" (Green) or "Dislike" (Red, with Thumbs Down icon).
*   **Visual Feedback:**
    *   **Sidebar Ratings:** Clear yellow star icons for your user rating.
    *   **Tooltips:** Hover over small cards in buckets to see full titles.

### 6. 📚 The Infinite Shelf (3D Gallery)
*The pièce de résistance.* View your anime as a digital book collection.
*   **🪜 Dynamic Racks:**
    *   **Master Data:** Your entire collection, sorted A-Z.
    *   **Status Racks:** Dedicated shelves for different statuses.
    *   **Tag Racks:** *Auto-magically* creates shelves based on genres (e.g., "Fantasy Shelf").
*   **📖 Interactive Books:**
    *   Click to pull a book off the shelf and flip through its pages.
    *   Click **Close (X)** to slide it back into place.

### 7. 🔧 Advanced Diagnostics & Repair
Keep your library in pristine condition with professional-grade maintenance tools.
*   **🩺 Health Check:** The system proactively identifies items with broken metadata or missing images.
*   **🪄 Targeted Auto-Repair:** One-click fix for minor issues. The system fetches fresh data from Jikan and patches only the broken fields.
*   **🧙‍♂️ Manual Repair Wizard:** For complex cases, enter a step-by-step wizard to search for the correct anime match and manually re-link your library item.

---

## 📖 User Manual

### 📥 How to Add an Anime
| Method | Steps |
| :--- | :--- |
| **Quick Add** | Go to **Explore** → Hover over card → Click `+` |
| **Manual Search** | Click `Add Anime` in header → Search Title → Add |
| **Get Suggestions** | Go to **Suggestions** → Drag preferences → Click Generate |

### 📈 Updating Your Progress
1.  Click on any anime card in your library.
2.  In the popup:
    *   Use the **Episode Counter** `+ / -` buttons.
    *   Set your **Score**.
    *   Add **Tags** (e.g., "Favorite", "Rewatch").
3.  Click `Save Changes`.

### ⚡ Troubleshooting
> **"Why is the title in Japanese?"**
> We try to fetch the English title first. If the official database only has the Romanized Japanese title, we display that instead to ensure accuracy.

> **"I see duplicates!"**
> Use the **Hard Refresh** button. It includes a smart deduplication algorithm that cleans your library while updating data.

---

## 💻 Tech Stack
<details>
<summary><strong>View Technical Details</strong></summary>

*   **Frontend:** React, TypeScript, Vite
*   **Styling:** TailwindCSS, Shadcn/UI, Framer Motion (for animations)
*   **Backend:** Supabase (PostgreSQL)
*   **Data Source:** Jikan API (MyAnimeList)
</details>
*   **State Management:** React Query (TanStack Query)
*   **Backend/DB:** Supabase (PostgreSQL)
*   **API:** Jikan v4 (REST)

</details>

---

*Crafted with ❤️ for an Anime Fan.*
