// --- 1. THE CLOUD CONNECTION ---
const supabaseUrl = 'https://fvrbhicruxqgddxixwns.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cmJoaWNydXhxZ2RkeGl4d25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MTM1MzAsImV4cCI6MjA4ODk4OTUzMH0.5WucFFm4zq7UEwsaUzQY1BPBbRRiDsNM2VvB0eUGh-s';

// FIX: We name our connection 'supabaseClient' to avoid confusing the computer
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// --- 2. THE UI SELECTORS ---
const addBtn = document.getElementById('add-btn');
const itemList = document.getElementById('item-list');

// AUTH SELECTORS:
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');

// --- 3. THE STATE (The App's Memory) ---
let myLinks = [];
let sortNewestFirst = true;
let showingArchive = false;
let currentUser = null; // Track who is logged in

// --- 4. THE AUTH WATCHER ---
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        // User is logged in!
        currentUser = session.user;
        
        // Swap screens
        authScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        
        // Load their specific links
        fetchLinks();
    } else {
        // No user logged in
        currentUser = null;
        
        // Swap screens
        appScreen.classList.add('hidden');
        authScreen.classList.remove('hidden');
    }
});

// --- 5. AUTH BUTTON ACTIONS ---

// Sign Up New Friend
signupBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) return alert("Please fill in both fields");

    const { error } = await supabaseClient.auth.signUp({ email, password });
    
    if (error) alert("Sign up error: " + error.message);
    else alert("Account created! Check your email for a confirmation link if required, or try logging in.");
});

// Log In Existing Friend
loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) return alert("Please fill in both fields");

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    if (error) alert("Login error: " + error.message);
});

// Log Out
logoutBtn.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) console.error("Logout failed:", error.message);
});

// --- 6. THE FUNCTIONS ---

// This function pulls data from the Cloud
async function fetchLinks() {
    if (!currentUser) return; // Guard clause if no one is logged in
    
    console.log("Fetching cloud links for user:", currentUser.email);
    const { data, error } = await supabaseClient
        .from('recs-links')
        .select('*')
        .eq('user_id', currentUser.id) // ONLY get links matching this user's ID
        .order('created_at', { ascending: !sortNewestFirst });

    if (error) {
        console.error("Error fetching:", error.message);
        return;
    }
    myLinks = data;
    renderLinks();
}

// The "Display Engine" that draws the HTML
function renderLinks() {
    itemList.innerHTML = '';
    
    let filteredLinks = myLinks.filter(item => 
        showingArchive ? item.status === 'archived' : item.status === 'active'
    );

    if (filteredLinks.length === 0) {
        itemList.innerHTML = `<p class="empty-state">${showingArchive ? 'No finished items.' : 'Inbox empty.'}</p>`;
        return;
    }

    filteredLinks.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'link-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <span style="color: ${item.themeColor}; font-size: 11px; font-weight: bold; text-transform: uppercase;">
                    ${item.source}
                </span>
                <small style="color: #8e8e93;">${new Date(item.created_at).toLocaleDateString()}</small>
            </div>
            <h3 style="margin: 8px 0; font-size: 18px;">${item.title}</h3>
            
            <div class="card-actions" style="margin-top: 12px; display: flex; gap: 20px;">
                <a href="${item.url}" target="_blank" style="color: #007aff; text-decoration: none; font-weight: 600;">Open</a>
                
                <button onclick="updateStatus(${item.id}, '${showingArchive ? 'active' : 'archived'}')" 
                        style="color: ${showingArchive ? '#007aff' : 'green'}; border:none; background:none; cursor:pointer; font-weight: 600;">
                    ${showingArchive ? 'Restore' : 'Done'}
                </button>
                
                <button onclick="permanentlyDelete(${item.id})" 
                        style="color: #ff3b30; border:none; background:none; cursor:pointer; font-weight: 600;">
                    Delete
                </button>
            </div>
        `;
        itemList.appendChild(card);
    });
}

// --- 7. EVENT LISTENERS ---

// Add a New Link
addBtn.addEventListener('click', async () => {
    const url = prompt("Paste your link here:");
    if (!url) return;

    const title = prompt("What should we call this?", "New Recommendation");
    if (!title) return;

    // Heuristics
    const lowerUrl = url.toLowerCase();
    let source = "Website", type = "article", color = "#8e8e93";
    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
        source = "YouTube"; color = "#FF0000";
    } else if (lowerUrl.includes("spotify.com")) {
        source = "Spotify"; color = "#1DB954";
    } else if (lowerUrl.includes("letterboxd.com")) {
        source = "Letterboxd"; color = "#00E054";
    } else if (lowerUrl.includes("goodreads.com")) {
        source = "Goodreads"; color = "#372213";
    } else if (lowerUrl.includes("instagram.com")) {
        source = "Instagram"; color = "#E1306C";
    }

    const newLinkData = {
        title: title,
        url: url,
        source: source,
        type: type,
        themeColor: color,
        status: 'active'
    };

    const { error } = await supabaseClient.from('recs-links').insert([newLinkData]);
    if (error) alert("Save failed: " + error.message);
    else fetchLinks();
});

// Update Status (Done/Restore)
async function updateStatus(id, newStatus) {
    const { error } = await supabaseClient
        .from('recs-links')
        .update({ status: newStatus })
        .eq('id', id);

    if (!error) fetchLinks();
    else console.error(error);
}

// Delete Forever
async function permanentlyDelete(id) {
    if (confirm("Delete this item forever?")) {
        const { error } = await supabaseClient
            .from('recs-links')
            .delete()
            .eq('id', id);

        if (!error) fetchLinks();
        else console.error(error);
    }
}

// Sorting Toggle
document.getElementById('sort-btn').onclick = () => {
    sortNewestFirst = !sortNewestFirst;
    fetchLinks();
};

// Toggle Archive View
document.getElementById('view-archive-btn').onclick = (e) => {
    showingArchive = !showingArchive;
    e.target.innerText = showingArchive ? "Back to Inbox" : "View Archived (Done) Items";
    document.querySelector('h1').innerText = showingArchive ? "Archive" : "My Inbox";
    renderLinks();
};

// Initialize the app
fetchLinks();