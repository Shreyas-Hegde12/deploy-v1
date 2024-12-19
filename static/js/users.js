const likeButton = document.querySelector('.like-button img');

let lsongname = 'song';
let lartist = 'artist';
let lmood = 'mood';
let song;
let lid = 1;
let lvidid = '';

// Retrieve liked songs from localStorage or use a default array as fallback
let likedSongs = JSON.parse(localStorage.getItem('user1_liked') || '[]');

let likeStatus = false;
likeButton.addEventListener('click', liketoggle);

function liketoggle() {
    if (likeStatus == true) {
        likeButton.src = 'static/images/not-liked.png';
        likeButton.classList.add('like-click');
        setTimeout(() => { likeButton.classList.remove('like-click'); }, 1000);
        likeStatus = false;
        lvidid = document.querySelector('.player img').getAttribute('data-videoid');
        if (lid - 1 > 0) lid--;
        removeSong(lvidid);
    } else {
        likeButton.src = 'static/images/liked.png';
        likeButton.classList.add('like-click');
        setTimeout(() => { likeButton.classList.remove('like-click'); }, 1000);
        likeStatus = true;
        lsongname = document.querySelector('.current-song-detail h2').innerText;
        lartist = document.querySelector('.current-song-detail p').innerText;
        lvidid = document.querySelector('.player img').getAttribute('data-videoid');
        lmood = emoji[lastcaptured];
        song = { id: lvidid, name: lsongname, artist: lartist, mood: lmood };
        if (lid - 1 > 0) lid++;
        addSong(song);
    }
}

// Function to render the liked songs list in the DOM
function renderLikedSongs() {
    const likedListContainer = document.querySelector('.liked-list');
    likedListContainer.innerHTML = ''; // Clear current list

    likedSongs.forEach(song => {
        const songElement = document.createElement('div');
        songElement.classList.add('liked-strip');
        songElement.innerHTML = `
            <p class="llsong-name">${song.name}</p>
            <p class="llartist-name">${song.artist}</p>
            <p class="llmood">${song.mood}</p>
            <button class="llminusbutton" data-id="${song.id}">-</button>
        `;
        songElement.addEventListener('click',function(){
            playLikedSong(`${song.id}`, `${song.artist}`);
        });

        // Attach event listener for the remove button dynamically
        songElement.querySelector('.llminusbutton').addEventListener('click', (event) => {
            const songminusid = event.target.dataset.id;
            removeSong(songminusid);
        });

        likedListContainer.appendChild(songElement);
    });
}

// Function to add a song to the liked songs list
function addSong(song) {
    likedSongs.push(song);  
    localStorage.setItem('user1_liked', JSON.stringify(likedSongs)); // Save to localStorage
    renderLikedSongs(); // Re-render the liked songs list
}

// Function to remove a song from the liked songs list by song ID
function removeSong(videoid) {
    likedSongs = likedSongs.filter(song => song.id !== videoid);  
    localStorage.setItem('user1_liked', JSON.stringify(likedSongs)); // Save to localStorage
    renderLikedSongs(); // Re-render the liked songs list
}

// Initial rendering of liked songs when the page loads
window.onload = function () {
    renderLikedSongs();
}

// Check if a song is liked
function checkifliked(videoid) {
    const lcheck = likedSongs;
    const lans = lcheck.filter(song => song.id == videoid); 
    return lans.length > 0;
}

// Function to play a liked song
async function playLikedSong(vidid, artst) {
    window.location.href = '#panels';
    cooldown(0);
    const ans = await fetch("/continuesongs", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
           'videoid': vidid,
            'artists': artst
        }),
    }).then(response => {
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        return response.json();
    }).then(data => {
        console.log("Liked Song Fetched: ", data);
        setSong(data);
    }).catch(error => {
        console.log("error from like-song fetch: ", error);
    });
}
