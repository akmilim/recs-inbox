const addBtn = document.getElementById('add-btn');
const itemList = document.getElementById('item-list');

// 1. LOAD: Instead of an empty [], we check localStorage first
// We use JSON.parse because localStorage saves everything as text
let myLinks = JSON.parse(localStorage.getItem('myInboxLinks')) || [];

// Run this immediately so saved links show up on page load
renderLinks();

addBtn.addEventListener('click', () => {
    const url = prompt("Paste your link here:");

    if (url) {
        // --- THE HEURISTICS START HERE ---
        let source = "Website";
        let type = "article";
        let color = "#8e8e93"; // Default grey

        // We convert the URL to lowercase so we don't miss "YouTube.com"
        const lowerUrl = url.toLowerCase();

        if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
            source = "YouTube";
            type = "video";
            color = "#FF0000"; // YouTube Red
        } else if (lowerUrl.includes("spotify.com")) {
            source = "Spotify";
            type = "audio";
            color = "#1DB954"; // Spotify Green
        } else if (lowerUrl.includes("letterboxd.com")) {
            source = "Letterboxd";
            type = "movie";
            color = "#00E054"; // Letterboxd Green
        } else if (lowerUrl.includes("goodreads.com")) {
            source = "Goodreads";
            type = "book";
            color = "#372213"; // Goodreads Brown
        } else if (lowerUrl.includes("instagram.com")) {
            source = "Instagram";
            type = "social";
            color = "#E1306C"; // Instagram Pink
        }
        // --- THE HEURISTICS END HERE ---

        const newLink = {
            title: url,
            link: url,
            source: source,
            type: type,
            themeColor: color,
            date: new Date().toLocaleDateString()
        };

        myLinks.push(newLink);
        localStorage.setItem('myInboxLinks', JSON.stringify(myLinks));
        renderLinks();
    }
});


function renderLinks() {
    itemList.innerHTML = '';

    if (myLinks.length === 0) {
        itemList.innerHTML = '<p class="empty-state">Your inbox is empty.</p>';
        return;
    }

    myLinks.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'link-card';
        
        // We use the themeColor to create a small "type" badge
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <span style="color: ${item.themeColor}; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                    ${item.source} • ${item.type}
                </span>
                <small style="color: #8e8e93;">${item.date}</small>
            </div>
            <div style="margin-top: 8px;">
                <a href="${item.link}" target="_blank" style="font-size: 16px; font-weight: 600;">
                    ${item.link}
                </a>
            </div>
        `;
        itemList.appendChild(card);
    });
} {
    itemList.innerHTML = '';

    if (myLinks.length === 0) {
        itemList.innerHTML = '<p class="empty-state">Your inbox is empty.</p>';
        return;
    }

    myLinks.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'link-card';
        card.innerHTML = `
            <p><strong>Added: ${item.date}</strong></p>
            <a href="${item.link}" target="_blank">${item.link}</a>
        `;
        itemList.appendChild(card);
    });
}