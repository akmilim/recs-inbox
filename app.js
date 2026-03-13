const addBtn = document.getElementById('add-btn');
const itemList = document.getElementById('item-list');

// 1. LOAD: Check localStorage first
let myLinks = JSON.parse(localStorage.getItem('myInboxLinks')) || [];

// Run this immediately so saved links show up on page load
renderLinks();

// Note the 'async' here - it's crucial for waiting on the internet!
addBtn.addEventListener('click', async () => {
    const url = prompt("Paste your link here:");
    if (!url) return;

    // Show a temporary message so the user knows something is happening
    console.log("Fetching title...");

    // 1. THE SCRAPER LOGIC
    let title = url; 
    try {
        // We use a different proxy just in case the first one is down
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (data.contents) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/html');
            const titleElement = doc.querySelector('title');
            
            if (titleElement && titleElement.innerText) {
                title = titleElement.innerText.trim();
            }
        }
    } catch (error) {
        console.error("Scraping failed:", error);
        // Backup Plan: Try to make the URL look like a title by removing "https://"
        title = url.replace('https://', '').replace('http://', '').split('/')[0];
    }

    // 2. THE HEURISTICS (Same as before)
    let source = "Website";
    let type = "article";
    let color = "#8e8e93";
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
        source = "YouTube"; type = "video"; color = "#FF0000";
    } else if (lowerUrl.includes("spotify.com")) {
        source = "Spotify"; type = "audio"; color = "#1DB954";
    } else if (lowerUrl.includes("letterboxd.com")) {
        source = "Letterboxd"; type = "movie"; color = "#00E054";
    }

    // 3. CREATE THE ITEM
    const newLink = {
        title: title, // Now using the real title!
        link: url,
        source: source,
        type: type,
        themeColor: color,
        date: new Date().toLocaleDateString()
    };

    myLinks.push(newLink);
    localStorage.setItem('myInboxLinks', JSON.stringify(myLinks));
    renderLinks();
});

// 2. THE RENDER FUNCTION (The only copy you need!)
function renderLinks() {
    itemList.innerHTML = '';
    if (myLinks.length === 0) {
        itemList.innerHTML = '<p class="empty-state">Your inbox is empty.</p>';
        return;
    }

    myLinks.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'link-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <span style="color: ${item.themeColor}; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${item.source} • ${item.type}
                </span>
                <small style="color: #8e8e93;">${item.date}</small>
            </div>
            <a href="${item.link}" target="_blank" style="text-decoration: none; color: #1c1c1e;">
                <h3 style="margin: 0; font-size: 17px; line-height: 1.3;">${item.title}</h3>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #007aff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${item.link}
                </p>
            </a>
        `;
        itemList.appendChild(card);
    });
}