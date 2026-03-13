const addBtn = document.getElementById('add-btn');
const itemList = document.getElementById('item-list');

// 1. LOAD: Check localStorage first
let myLinks = JSON.parse(localStorage.getItem('myInboxLinks')) || [];
let sortNewestFirst = true; // Our default sort
let showingArchive = false; // To toggle between Inbox and Archive

// Run this immediately so saved links show up on page load
renderLinks();

addBtn.addEventListener('click', () => {
    // 1. Ask for the Link
    const url = prompt("Paste your link here:");
    if (!url) return; // Exit if they hit cancel

    // 2. Ask for the Name (Manual Title)
    const title = prompt("What should we call this?", "New Recommendation");
    if (!title) return;

    // 3. THE HEURISTICS (Patterns)
    const lowerUrl = url.toLowerCase();
    let source = "Website", type = "article", color = "#8e8e93";

    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
        source = "YouTube"; type = "video"; color = "#FF0000";
    } else if (lowerUrl.includes("spotify.com")) {
        source = "Spotify"; type = "audio"; color = "#1DB954";
    } else if (lowerUrl.includes("letterboxd.com")) {
        source = "Letterboxd"; type = "movie"; color = "#00E054";
    } else if (lowerUrl.includes("goodreads.com")) {
        source = "Goodreads"; type = "book"; color = "#372213";
    } else if (lowerUrl.includes("instagram.com")) {
        source = "Instagram"; type = "social"; color = "#E1306C";
    }

    // 4. CREATE THE ITEM
    const newLink = {
        status: 'active',
        id: Date.now(),
        title: title,
        link: url,
        source: source,
        type: type,
        themeColor: color,
        date: new Date().toLocaleDateString()
    };

    // 5. SAVE
    myLinks.push(newLink);
    localStorage.setItem('myInboxLinks', JSON.stringify(myLinks));
    renderLinks();
});


// 2. THE RENDER FUNCTION (The only copy you need!)
function renderLinks() {
    itemList.innerHTML = '';
    
    // 1. FILTER: Decide whether to show 'active' or 'archived'
    let filteredLinks = myLinks.filter(item => 
        showingArchive ? item.status === 'archived' : item.status === 'active'
    );

    // 2. SORT: Order by date
    filteredLinks.sort((a, b) => {
        return sortNewestFirst 
            ? new Date(b.dateAdded) - new Date(a.dateAdded) 
            : new Date(a.dateAdded) - new Date(b.dateAdded);
    });

    if (filteredLinks.length === 0) {
        itemList.innerHTML = `<p class="empty-state">${showingArchive ? 'No finished items yet.' : 'Inbox empty.'}</p>`;
        return;
    }

    filteredLinks.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'link-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <span style="color: ${item.themeColor}; font-size: 11px; font-weight: bold;">${item.source}</span>
                <small>${item.date}</small>
            </div>
            <h3 style="margin: 5px 0;">${item.title}</h3>
            
            <div class="card-actions" style="margin-top: 10px; display: flex; gap: 15px;">
                <a href="${item.link}" target="_blank">Open</a>
                
                ${!showingArchive ? 
                    `<button onclick="updateStatus(${item.id}, 'archived')" style="color: green; border:none; background:none; cursor:pointer;">Done</button>` : 
                    `<button onclick="updateStatus(${item.id}, 'active')" style="color: blue; border:none; background:none; cursor:pointer;">Restore</button>`
                }
                
                <button onclick="permanentlyDelete(${item.id})" style="color: red; border:none; background:none; cursor:pointer;">Delete</button>
            </div>
        `;
        itemList.appendChild(card);
    });
}
function archiveLink(id) {
    // 1. Find the specific link in our big list
    const index = myLinks.findIndex(item => item.id === id);
    
    // 2. Change its status to 'archived'
    if (index !== -1) {
        myLinks[index].status = 'archived';
    }

    // 3. Save the whole list (including the now-archived one)
    localStorage.setItem('myInboxLinks', JSON.stringify(myLinks));

    // 4. Refresh the screen
    renderLinks();
}
// Function for sorting toggle
document.getElementById('sort-btn').onclick = () => {
    sortNewestFirst = !sortNewestFirst;
    renderLinks();
};

// Function for switching between Inbox and Archive
document.getElementById('view-archive-btn').onclick = (e) => {
    showingArchive = !showingArchive;
    e.target.innerText = showingArchive ? "Back to Inbox" : "View Archived (Done) Items";
    document.querySelector('h1').innerText = showingArchive ? "Archive" : "My Inbox";
    renderLinks();
};

// Update status (Move to Done or Restore)
function updateStatus(id, newStatus) {
    const index = myLinks.findIndex(item => item.id === id);
    if (index !== -1) myLinks[index].status = newStatus;
    saveAndRefresh();
}

// The Emergency Exit (Actual Delete)
function permanentlyDelete(id) {
    if (confirm("Are you sure? This removes it forever.")) {
        myLinks = myLinks.filter(item => item.id !== id);
        saveAndRefresh();
    }
}

function saveAndRefresh() {
    localStorage.setItem('myInboxLinks', JSON.stringify(myLinks));
    renderLinks();
}