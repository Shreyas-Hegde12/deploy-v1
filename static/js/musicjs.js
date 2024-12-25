//constants
let isPlaying = false;
let loading = false;
let songFetched = false;
let audioElement = new Audio();
let currentSong = '';
let currentNote = '';
const note = {
    'neutral': "Wow! Been a while seeing a calm face! <br>",
    'happy': "You look so happy! Lets Elevate your mood ++ <br>",
    'surprised': "Want a surprise? <br>",
    'sad': ["Buckle up soldier! Don't be sad! Life is not yet over <br>", "You are sad!! Cry it out and feel lighter!!<br>"],
    'angry': "Ooh! You look angry.. Being happy is still a choice... <br>",
}
const fallbackimg = 'static/images/transparent.png';
const playButton = document.querySelector('.play-button div');
const slider = document.getElementById("music-slider");


//Event Listeners
document.addEventListener('DOMContentLoaded', fetchSongOnEmotion('starter'));


//Play-Pause Button
function togglePlay() {
    isPlaying = !isPlaying;
    if (!songFetched) {
        playButton.innerHTML = "<svg id='loading-song' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><radialGradient id='l2' cx='.66' fx='.66' cy='.3125' fy='.3125' gradientTransform='scale(1.5)'><stop offset='0' stop-color='#000'></stop><stop offset='.3' stop-color='#000' stop-opacity='.9'></stop><stop offset='.6' stop-color='#000' stop-opacity='.6'></stop><stop offset='.8' stop-color='#000' stop-opacity='.3'></stop><stop offset='1' stop-color='#000' stop-opacity='0'></stop></radialGradient><circle transform-origin='center' fill='none' stroke='url(#l2)' stroke-width='15' stroke-linecap='round' stroke-dasharray='200 1000' stroke-dashoffset='0' cx='100' cy='100' r='70'><animateTransform type='rotate' attributeName='transform' calcMode='spline' dur='2' values='360;0' keyTimes='0;1' keySplines='0 0 1 1' repeatCount='indefinite'></animateTransform></circle><circle transform-origin='center' fill='none' opacity='.2' stroke='#fff' stroke-width='15' stroke-linecap='round' cx='100' cy='100' r='70'></circle></svg>";
        loading = true;
        return;
    }
    playButton.textContent = isPlaying ? '⏸' : '▶';
    if (isPlaying) {
        document.querySelector('#video-container').classList.remove('smooth-transition2');
        document.querySelector('#video-container').classList.add('gradient');
        stopCamera();
        audioElement.play();
        cameraONOFF('off');
        document.querySelector('.listening-music-gif').style.transform = 'translate(-50%,-50%) scale(1)';
    } else {
        startCamera();
        audioElement.pause();
        cameraONOFF('on');
        document.querySelector('.listening-music-gif').style.transform = 'translate(-50%,-50%) scale(0)';
        const stEnd = setTimeout(()=>{
            document.querySelector('#video-container').classList.add('smooth-transition2');
            document.querySelector('#video-container').classList.remove('gradient');
        },700);
    }
}


//Update Slider
let manualMove = false;
let slide;
function updateSlider(action) {
    if (action == 'reset') {
        slider.value = audioElement.currentTime;
        slider.max = audioElement.duration;
    }
    if (action == 'update') {
        audioElement.currentTime = slider.value;
        manualMove = false;
    }
    if (slide) {
        clearInterval(slide);
    }
    slide = setInterval(() => {
        if (!manualMove) {
            slider.value = audioElement.currentTime;
            slider.max = audioElement.duration;
        }
    }, 1000);
}
document.getElementById("music-slider").addEventListener("input", () => {
    manualMove = true;
});


// GetRecommendation
async function fetchSongOnEmotion(emotion) {
    const response = await fetch('/recommendation', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            'emotion': emotion
        }),
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }).then(data => {
        console.log("Received data:", data);
        // Set Song Data
        if(isThrowing){
            const stopTillThrow = setTimeout(function(){setSong(data);},1e3);
        }else{
            setSong(data);
        }
        // Set Recommendation Note
        currentNote = (note[emotion] || '') + 'Playing for you ' + ' <b>' + data.note + '</b>';
        if (emotion == 'sad') {
            const n = data.note;
            const lastletter = n.charAt(n.length - 1);
            if (lastletter === 's') {
                data.note = n.slice(0, n.length - 1); // Removing the last character if it's 's'
                currentNote = note[emotion][1] + ' Playing for you ' + ' <b>' + data.note + '</b>';
            } else {
                currentNote = note[emotion][0] + ' Playing for you ' + ' <b>' + data.note + '</b>';
            }
        }
        document.querySelector('#recommendation-note').innerHTML = currentNote;
        // Note Glow
        const glow = setTimeout(() => {
            document.querySelector('b').classList.add('note-glow');
        }, 3e3);
    }).catch(error => {
        console.error("Error fetching data:", error);
    });
}


// Get SongUrl
async function fetchUrl(videoid) {
    const response = await fetch('/songurl', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            'videoid': videoid
        }),
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }).then(data => {
        console.log("Received data:", data);
        // Many song's urls can arrive one after other while browsing. So set the correct url to the song, user is currently waiting for
        if(data.videoid == currentSong){
            audioElement.src = data.songurl;
            songFetched = true;
            // User Already Waiting for SongUrl (i.e, song play button clicked)
            if (loading == true) {
                document.querySelector('#video-container').classList.remove('smooth-transition2');
                document.querySelector('#video-container').classList.add('gradient');
                stopCamera();
                audioElement.play();
                playButton.textContent = '⏸';
                cameraONOFF('off');
                document.querySelector('.listening-music-gif').style.transform = 'translate(-50%,-50%) scale(1)';
                loading = false;
            }
            // Reset Slider
            setTimeout(() => {
                updateSlider('reset');
            }, 1e3);
        }
    }).catch(error => {
        console.error("Error fetching data:", error);
    });
}


// Get Similar Songs
async function similarSongs(videoid) {
    const response = await fetch('/similar', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            'videoid': videoid
        }),
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }).then(data => {
        console.log("Received data:", data);
        setSimilarSongData(data);
    }).catch(error => {
        console.error("Error fetching similar songs:", error);
    });
}


// Search 
async function searchFeature() {
    const query = document.querySelector('#search-bar').value;
    document.querySelector('#search-in-progress').style.transform = 'scale(1)';
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
        console.log("Search Result is: ", data);
        setSong(data);
        document.querySelector('#search-in-progress').style.transform = 'scale(0)';
    }).catch(error => {
        console.log("error from search: ", error);
    });
}


// Get Lyrics
const engREGEX = new RegExp("^[A-Za-z0-9\\s.,?!'\";:()-]*$");
var currentLyrics;
var engLyrics;
async function lyrics(){
    const lyrics = await fetch('/lyrics', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            'videoid': currentSong
        }),
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }).then(data => {
        console.log("Received data:", data);
        const isEnglish = engREGEX.test(data.lyrics);
        currentLyrics = data.lyrics;
        document.querySelector('.lyrics-body').innerText = currentLyrics;
        if(isEnglish == false){getLyricsinEnglish();} 
    }).catch(error => {
        console.error("Error fetching similar songs:", error);
    });
}

// Lyrics Helper Functions (for transliteration support)
function getLyricsinEnglish(){
    document.querySelector('.lyrics-body').style.marginTop = '5vh';
    document.querySelector('.to-eng-loading').style.display='block';
    engLyrics = transliterate(currentLyrics);
    setTimeout(()=>{
        document.querySelector('.lyrics-body').innerText = engLyrics;
        document.querySelector('.to-eng-loading').style.display='none';
        document.querySelector('.keep-original-lyrics').style.display='block';
    },2e3);
}
function keepOriginalLyrics(){
    if(document.querySelector('.keep-original-lyrics').innerText=='No, Type this in English'){
        document.querySelector('.lyrics-body').innerText = engLyrics;
        document.querySelector('.keep-original-lyrics').innerText='Keep Original';
    }
    else{
    document.querySelector('.lyrics-body').innerText = currentLyrics;
    document.querySelector('.keep-original-lyrics').innerText='No, Type this in English';
    }
}


// Set Received Recommendation Data
function setSong(data) {
    if (data) {
        currentSong = data.videoid;
        if (data.title.length > 23) {
            data.title = data.title.slice(0, 20) + '..';
        }
        if (data.artists.length > 17) {
            data.artists = data.artists.slice(0, 17) + '..';
        }
    }
    // Set Main Song Data
    document.querySelector('.lyrics-panel p').innerText = 'Fetching lyrics for you..';
    if(lyricVisible){
        lyrics(); 
        document.querySelector('.keep-original-lyrics').style.display='none';
        document.querySelector('.lyrics-body').style.marginTop = '0vh';
    }
    document.querySelector('.player > div > img').src = data.coverart || fallbackimg;
    document.querySelector('.player > div > img').setAttribute('data-videoid', data.videoid);
    document.querySelector('.current-song-detail h2').textContent = data.title;
    document.querySelector('.current-song-detail p').textContent = data.artists;
    // Reset Running Elements, Like Status
    audioElement.pause();
    if (isPlaying) togglePlay();
    songFetched = false;
    // Like Status
    if(!checkifliked(data.videoid)){
        likeButton.src = 'static/images/not-liked.png';
        likeStatus = false; 
    }else{
        likeButton.src = 'static/images/liked.png';
        likeStatus = true; 
    }
    // Like Animation
    const liking = setTimeout(function(){
        likeButton.classList.add('like-click');
        const likingEnd = setTimeout(function(){likeButton.classList.remove('like-click');}, 1e3);
    },1e3);
    // Ask Similar Songs Now
    similarSongs(data.videoid);
    // Ask Current Song's Url Now
    fetchUrl(data.videoid);
}


// Set Similar Songs Data
function setSimilarSongData(data){
    const cards = [data.similar1, data.similar2, data.similar3]
    cards.forEach(function(card) {
        if (card.title.length > 23) {
            card.title = card.title.slice(0, 18) + '..';
        }
        if (card.artists.length > 20) {
            card.artists = card.artists.slice(0, 17) + '..';
        }
    });
    document.querySelector('#similar1 img').src = data.similar1.coverart || fallbackimg;
    document.querySelector('#similar1').setAttribute('data-videoid', data.similar1.videoid);
    document.querySelector('#similar1 h3').textContent = data.similar1.title || 'Unknown Title';
    document.querySelector('#similar1 p').textContent = data.similar1.artists || 'Unknown Artist';
    document.querySelector('#similar2 img').src = data.similar2.coverart || fallbackimg;
    document.querySelector('#similar2').setAttribute('data-videoid', data.similar2.videoid);
    document.querySelector('#similar2 h3').textContent = data.similar2.title || 'Unknown Title';
    document.querySelector('#similar2 p').textContent = data.similar2.artists || 'Unknown Artist';
    document.querySelector('#similar3 img').src = data.similar3.coverart || fallbackimg;
    document.querySelector('#similar3').setAttribute('data-videoid', data.similar3.videoid);
    document.querySelector('#similar3 h3').textContent = data.similar3.title || 'Unknown Title';
    document.querySelector('#similar3 p').textContent = data.similar3.artists || 'Unknown Artist';
}

// Lyrics See/Hide Button
let lyricVisible = false;
function lyricToggle(){
if(lyricVisible){document.querySelector('.lyrics-panel').style.display = 'none'; cameraONOFF('on'); lyricVisible = false;}
else{ 
    if(document.querySelector('.lyrics-panel p').innerText == 'Fetching lyrics for you..'){
        lyrics(); 
    }
    document.querySelector('.lyrics-panel').style.display = 'flex'; cameraONOFF('off'); lyricVisible=true;
}
}

// When Song Ends Play a similar song
audioElement.addEventListener('ended', () => {
    console.log('Song has ended!');
    // Handle what happens when the song ends
    playNextSong(); // Example: Play the next song
});

// Next Song Player
function playNextSong(){
    similarSongClicked('#similar1');
    // Reset slider
    slider.value = 0;
    audioElement.src = '';
}


// SimilarSong Clicked By User
function similarSongClicked(id){
const sId = document.querySelector(id).getAttribute('data-videoid'),
sTitle = document.querySelector(id).querySelector('h3').innerText,
sArtists = document.querySelector(id).querySelector('p').innerText,
sCoverimg = document.querySelector(id).querySelector('img').src;
data = {
    "title":sTitle,
    "artists":sArtists,
    "coverart":sCoverimg,
    "videoid":sId
};
setSong(data);
if(isPlaying){
    togglePlay();
}
}