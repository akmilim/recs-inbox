// --- 1. THE CLOUD CONNECTION ---
// Paste your actual URL and Key inside the quotes
const supabaseUrl = 'https://fvrbhicruxqgddxixwns.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cmJoaWNydXhxZ2RkeGl4d25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MTM1MzAsImV4cCI6MjA4ODk4OTUzMH0.5WucFFm4zq7UEwsaUzQY1BPBbRRiDsNM2VvB0eUGh-s';

// This initializes the connection (Note: I changed the variable name slightly to 'supabase' for simplicity)
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// --- 2. THE UI SELECTORS ---
// We keep these so the app knows which buttons to listen to
const addBtn = document.getElementById('add-btn');
const itemList = document.getElementById('item-list');

// --- 3. THE DATA ---
// We start with an empty list. We will fill this from the cloud in a moment.
let myLinks = [];


// 1. LOAD: Check localStorage first
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

    // ... (Your prompt and heuristic code stays the same) ...

    const newLinkData = {
        title: title,
        url: url,
        source: source,
        type: type,
        themeColor: color,
        status: 'active'
    };

    // SAVE TO CLOUD:
    const { error } = await supabase
        .from('links')
        .insert([newLinkData]);

    if (error) {
        alert("Failed to save to cloud: " + error.message);
    } else {
        // Refresh the list to show the new item
        fetchLinks();
    }
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

    // 3. Refresh the screen
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
async function updateStatus(id, newStatus) {
    const { error } = await supabase
        .from('links')
        .update({ status: newStatus })
        .eq('id', id); // 'eq' means 'equal to' - find the right row!

    if (!error) fetchLinks();
}

// The Emergency Exit (Actual Delete)
async function permanentlyDelete(id) {
    if (confirm("Delete forever?")) {
        const { error } = await supabase
            .from('links')
            .delete()
            .eq('id', id);

        if (!error) fetchLinks();
    }
}

// This turns your links into a "JSON" text file and downloads it
function exportData() {
    const dataStr = JSON.stringify(myLinks);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'recs_backup.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// This lets you paste that text back in if you ever lose your data
function importData() {
    const json = prompt("Paste your backup text here:");
    if (json) {
        try {
            myLinks = JSON.parse(json);
            saveAndRefresh();
            alert("Data restored successfully!");
        } catch (e) {
            alert("Invalid backup data.");
        }
    }
}
// This function goes to the Cloud and brings the data back
async function fetchLinks() {
    console.log("Fetching from cloud...");
    
    // 1. Ask Supabase for everything in the 'links' table
    const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: sortNewestFirst ? false : true });

    if (error) {
        console.error("Error fetching links:", error.message);
        return;
    }

    // 2. Update our local variable with the cloud data
    myLinks = data;

    // 3. Draw the list on the screen
    renderLinks();
}

// 4. IMPORTANT: Call this function when the page first loads
fetchLinks();