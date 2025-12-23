# Anime Previewer - Application Walkthrough & Manual

## Overview
**Anime Previewer** is a modern, visually immersive anime library management application. It allows users to track their watched and planned anime series, explore a global database of anime powered by the **Jikan API (MyAnimeList)**, and visualize their collection in a unique, 3D "Infinite Shelf" environment.

---

## 🚀 Key Features

### 1. Dashboard (Home)
The central hub of your anime journey.
- **Library Categories:** Switch seamlessly between "Watched" and "Plan to Watch" lists using the integrated tab system.
- **Quick Stats:** View your total anime count and progress at a glance.
- **Quote of the Day:** Get inspired by a daily random anime quote displayed at the top.
- **Smart Cards:** Anime cards display the **English Title** by default (e.g., "Attack on Titan"), falling back to Romaji if unavailable. They feature high-quality cover art and quick-status indicators.

### 2. Global Explore & Search
Discover new anime without leaving the app.
- **Powered by Jikan API:** Access the massive MyAnimeList database directly.
- **Search & Filter:** Search for specific titles or browse by Popularity, Rank, or Season. Use the "Tags" filter to include or exclude specific genres (e.g., "Action", "Romance").
- **Quick Add:** Hover over any card in the Explore tab and click the **Plus (+)** icon. A satisfying green checkmark animation confirms the addition to your "Plan to Watch" list instantly.
- **Infinite Scroll:** Browse endlessly with optimized performance.
- **Scroll Preservation:** Closing an anime's detail view remembers your scroll position, so you never lose your place.

### 3. Library Management
Full control over your collection.
- **Add Anime:** Use the "Add Anime" button to search specifically for titles to add. The dialog shows English titles prominently with Romaji subtitles.
- **Edit Details:** Click on any card in your library to open the **Details Dialog**.
    - **Update Progress:** Track episodes watched.
    - **Rate:** Give a score from 1-10.
    - **Community Score:** View the global MyAnimeList rating alongside your own.
    - **Notes:** Add personal notes or reviews.
    - **Tags:** Manage custom tags for sorting.

### 4. Data Management
- **Hard Refresh:** A button in the top-left corner allows you to re-sync your entire library.
    - Useful for filling missing data (like "Format") or updating titles.
    - Features a **"Data Uplink" visual experience** to track progress with style.
    - Processes items rapidly (approx. 2 items per second).
- **English Titles:** The application automatically fetches and displays English titles for your library items to ensure consistency.

### 4. 📚 Infinite Shelf (3D Gallery)
A unique way to browse your collection.
- **3D Book Experience:** Your anime are rendered as 3D books on a virtual wooden shelf.
- **Categorized Racks:**
    - **Master Data:** A complete, alphabetical collection of all your anime.
    - **Watched / Plan to Watch:** Dedicated racks for your status lists.
    - **Tag Racks:** Automatically generated racks based on your anime tags (e.g., a shelf just for "Fantasy").
- **Interactive Reading:** Click a book to open it. Flip through pages of cover art and localized titles.
- **Features:**
    - **English Titles:** Books generate covers using English titles.
    - **Alphabetical Sorting:** Racks are automatically sorted A-Z for easy finding.
    - **Duplicate Removal:** Smart deduplication ensures each anime appears only once per rack.

### 5. Technical Highlights
- **Supabase Integration:** All your data (library, ratings, notes) is securely persisted in the cloud.
- **Responsive Design:** Works beautifully on Desktop, Tablet, and Mobile screens.
- **Performance:** Optimized image loading and React Query caching for snappy interactions.

---

## 📖 User Manual

### How to Add an Anime
1. Navigate to the **Explore** tab.
2. Browse or search for an anime.
3. Click the **Plus (+)** button on the card.
4. **Alternative:** Click the "Add Anime" button in the top header to search and add explicitly.

### How to Update Progress
1. Click on an anime card in your **Watched** or **Plan to Watch** list.
2. In the popup dialog, use the **Episode Counter** to increment your progress.
3. Select a **Rating** (optional).
4. Click **Save Changes**.

### Using the Infinite Shelf
1. Click the **"Infinite Shelf"** link/icon in the navigation menu.
2. Scroll down to view different racks (Master Data, Watched, Tags).
3. **Click a Book** to pull it off the shelf and view it.
4. Click the **Left/Right arrows** (or edges) to flip through the book's pages working like a visual gallery.
5. Click **Close (X)** to return the book to the shelf.

### Troubleshooting
- **Missing English Title?** The app attempts to fetch English titles from Jikan. If none exists officially, it will display the Romaji title.
- **Duplicate Items?** The system automatically deduplicates based on MyAnimeList IDs. If you see duplicates, try refreshing the page to trigger a re-sync.
