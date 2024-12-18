const likeButton = document.querySelector('.like-button img');

let lsongname='song';
let lartist='artist';
let lmood='mood';
let song;
let lid=1;
let lvidid='';

let likeStatus = false;
likeButton.addEventListener('click', liketoggle);
function liketoggle() {
    if (likeStatus == true) {
        likeButton.src = 'static/images/not-liked.png';
        likeButton.classList.add('like-click');
        const liking = setTimeout(function(){likeButton.classList.remove('like-click');},1e3);
        likeStatus = false; 
        lvidid = document.querySelector('.player img').getAttribute('data-videoid');
        if(lid-1>0)
            lid--;
        removeSong(lvidid);
    } else {
        likeButton.src = 'static/images/liked.png';
        likeButton.classList.add('like-click');
        const liking = setTimeout(function(){likeButton.classList.remove('like-click');},1e3);
        likeStatus = true;
        lsongname = document.querySelector('.current-song-detail h2').innerText;
        lartist = document.querySelector('.current-song-detail p').innerText;
        lvidid = document.querySelector('.player img').getAttribute('data-videoid');
        lmood = emoji[lastcaptured];
        song = {id: lvidid, name: lsongname, artist: lartist, mood: lmood};
        if(lid-1>0)
            lid++;
        addSong(song);
    }
}

let likedSongs = [
    { id: '', name: 'Song 1', artist: 'Artist 1', mood: '😀 Happy' },
    { id: '', name: 'Song 2',  artist: 'Artist 2', mood: '😔 Sad' }
];

// Function to render the liked songs list in the DOM
function renderLikedSongs() {
    const likedListContainer = document.querySelector('.liked-list');
    likedListContainer.innerHTML = ''; // Clear current list
    likedSongs.forEach(song => {
        const songElement = document.createElement('div');
        songElement.addEventListener('click', () => playLikedSong(`${song.artist} ${song.name}`));
        songElement.classList.add('liked-strip');
        songElement.innerHTML = `
            <p class="llsong-name">${song.name}</p>
            <p class="llartist-name">${song.artist}</p>
            <p class="llmood">${song.mood}</p>
            <button class="llminusbutton" onclick="removeSong('${song.id}')">-</button>
        `;

        likedListContainer.appendChild(songElement);
    });
}

// Function to add a song to the liked songs list
function addSong(song) {
    likedSongs.push(song);  // Add the new song to the likedSongs array
    renderLikedSongs(); // Re-render the liked songs list
}

// Function to remove a song from the liked songs list by song ID
function removeSong(videoid) {
    likedSongs = likedSongs.filter(song => song.id !== videoid);  // Remove song with the given ID
    renderLikedSongs(); // Re-render the liked songs list
}

// Initial rendering of liked songs
window.onload = function(){
renderLikedSongs();
likedSongs = [];
}

function checkifliked(videoid){
    const lcheck = likedSongs;
    lans = lcheck.filter(song => song.id == videoid); 
    if(lans.length>0)
        return true;
    return false;
}


document.querySelectorAll('.llminusbutton').forEach(button =>{button.addEventListener('click',()=>{
    const songminusid = button.dataset.id;
    removeSong(songminusid);
});});

async function playLikedSong(query){
    window.location.href='#panels';
    cooldown(0);
    const ans = await fetch("/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "query": query
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