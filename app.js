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
        const newLink = {
            title: url,
            link: url,
            date: new Date().toLocaleDateString() // Let's add the date too!
        };

        myLinks.push(newLink);

        // 2. SAVE: Put the updated list into the filing cabinet
        // We use JSON.stringify because localStorage only stores strings
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
        card.innerHTML = `
            <p><strong>Added: ${item.date}</strong></p>
            <a href="${item.link}" target="_blank">${item.link}</a>
        `;
        itemList.appendChild(card);
    });
}