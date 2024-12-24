//constants
let lsongname = 'song';
let lartist = 'artist';
let lmood = 'mood';
let song;
let lvidid = '';
let likeStatus = false;
let likedSongs = JSON.parse(localStorage.getItem('user1_liked')) || [];
const likeButton = document.querySelector('.like-button img');


// Initial rendering of liked songs when the page loads
window.onload = function () {
    renderLikedSongs();
}


// Like Button Function
function liketoggle() {
    if (likeStatus == false) {
        likeButton.src = 'static/images/liked.png';
        likeStatus = true;
        lsongname = document.querySelector('.current-song-detail h2').innerText;
        lartist = document.querySelector('.current-song-detail p').innerText;
        lvidid = document.querySelector('.player img').getAttribute('data-videoid');
        lcoverimg = document.querySelector('.player img').getAttribute('src');
        lmood = emoji[lastcaptured];
        song = { id: lvidid, title: lsongname, artists: lartist, mood: lmood, coverart: lcoverimg };
        addSong(song);
    } else {
        likeButton.src = 'static/images/not-liked.png';
        likeStatus = false;
        lvidid = document.querySelector('.player img').getAttribute('data-videoid');
        removeSong(lvidid);
    }
    likeButton.classList.add('like-click');
    const likeclickend = setTimeout(() => { likeButton.classList.remove('like-click'); }, 1000);
}


// Display Current Liked Songs List
function renderLikedSongs() {
    const likedListContainer = document.querySelector('.liked-list');
    likedListContainer.innerHTML = ''; // Clear current list
    likedSongs.forEach(song => {
        const songElement = document.createElement('div');
        songElement.classList.add('liked-strip');
        if (song.artists.length > 11) {
            song.artists = song.artists.slice(0, 11);
        }
        songElement.innerHTML = `
            <div>
            <p class="llsong-name">${song.title}</p>
            <p class="llartist-name">${song.artists}</p>
            <p class="llmood">${song.mood}</p>
            </div>
            <button class="llminusbutton" data-id="${song.id}">-</button>
        `;
        songElement.querySelector('div').addEventListener('click',function(){
            playLikedSong(`${song.id}`, `${song.title}`, `${song.artists}`,`${song.coverart}`);
        });
        // Attach click event listener for the remove-song-button
        songElement.querySelector('.llminusbutton').addEventListener('click', (event) => {
            const songminusid = event.target.dataset.id;
            removeSong(songminusid);
            likeButton.src = 'static/images/not-liked.png';
            likeStatus = false; 
        });
        likedListContainer.appendChild(songElement);
    });
}


// Add Song
function addSong(song) {
    likedSongs.push(song);  
    localStorage.setItem('user1_liked', JSON.stringify(likedSongs)); // Save to localStorage
    renderLikedSongs(); // Re-render the liked songs list
}


// Remove Song
function removeSong(videoid) {
    likedSongs = likedSongs.filter(song => song.id !== videoid);  
    localStorage.setItem('user1_liked', JSON.stringify(likedSongs)); // Save to localStorage
    renderLikedSongs(); // Re-render the liked songs list
}


// Check if a song is liked
function checkifliked(videoid) {
    const lcheck = likedSongs;
    const lans = lcheck.filter(song => song.id == videoid); 
    return lans.length > 0;
}


// Liked song clicked By User to play it
function playLikedSong(videoid, title, artists, coverart) {
    window.location.href = '#panels';
    cooldown(2e3);
    data = {
        "title": title,
        "artists": artists,
        "coverart": coverart,
        "videoid": videoid
    };
    setSong(data);
}

let navVisible = false;
function pullNav(){
    if(navVisible){
        document.querySelector('body').style.marginTop = '-70px';
        navVisible = false;
    }
    else{
        document.querySelector('body').style.marginTop = '0px';
        navVisible = true;
    }
}