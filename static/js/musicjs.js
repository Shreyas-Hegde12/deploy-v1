const note = {
    'neutral': "Wow! Been a while seeing a calm face! <br>",
    'happy': "You look so happy! Lets Elevate your mood ++ <br>",
    'surprised': "Want a surprise? <br>",
    'sad': ["Buckle up soldier! Don't be sad! Life is not yet over <br>", "You are sad!! Cry it out and feel lighter!!<br>"],
    'angry': "Ooh! You look angry.. Being happy is still a choice... <br>",
}
let isPlaying = false;
let loading = false;
let songFetched = false;
let audioElement = new Audio();
const playButton = document.querySelector('.play-button div');

function togglePlay() {
    isPlaying = !isPlaying;
    if (!songFetched | loading) {
        playButton.innerHTML = "<svg id='loading-song' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><radialGradient id='l2' cx='.66' fx='.66' cy='.3125' fy='.3125' gradientTransform='scale(1.5)'><stop offset='0' stop-color='#000'></stop><stop offset='.3' stop-color='#000' stop-opacity='.9'></stop><stop offset='.6' stop-color='#000' stop-opacity='.6'></stop><stop offset='.8' stop-color='#000' stop-opacity='.3'></stop><stop offset='1' stop-color='#000' stop-opacity='0'></stop></radialGradient><circle transform-origin='center' fill='none' stroke='url(#l2)' stroke-width='15' stroke-linecap='round' stroke-dasharray='200 1000' stroke-dashoffset='0' cx='100' cy='100' r='70'><animateTransform type='rotate' attributeName='transform' calcMode='spline' dur='2' values='360;0' keyTimes='0;1' keySplines='0 0 1 1' repeatCount='indefinite'></animateTransform></circle><circle transform-origin='center' fill='none' opacity='.2' stroke='#fff' stroke-width='15' stroke-linecap='round' cx='100' cy='100' r='70'></circle></svg>";
        loading = true;
        return;
    }
    playButton.textContent = isPlaying ? '⏸' : '▶';
    if (isPlaying) {
        audioElement.play();
        cameraONOFF('off');
    } else {
        audioElement.pause();
        cameraONOFF('on');
    }
}
const slider = document.getElementById("music-slider");
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

// Set Audio Source 
function setSong(data) {
    if (data) {
        const cards = [data.mainsong, data.similar1, data.similar2, data.similar3]
        cards.forEach(function(song) {
            if (song.title.length > 23) {
                song.title = song.title.slice(0, 22) + '..';
            }
            if (song.artist.length > 20) {
                song.artist = song.artist.slice(0, 17) + '..';
            }
        });
    }
    document.querySelector('.lyrics-panel p').innerText = 'Fetching lyrics for you..';
    const fallbackimg = 'static/images/transparent.png';
    document.querySelector('.player img').src = data.mainsong.coverart || fallbackimg;
    document.querySelector('.player img').setAttribute('data-videoid', data.mainsong.videoid);
    document.querySelector('.player h2').textContent = data.mainsong.title || 'Unknown Title';
    document.querySelector('.player p').textContent = data.mainsong.artist || 'Unknown Artist';
    document.querySelector('#similar1 img').src = data.similar1.coverart || fallbackimg;
    document.querySelector('#similar1').setAttribute('data-videoid', data.similar1.videoid);
    document.querySelector('#similar1 h3').textContent = data.similar1.title || 'Unknown Title';
    document.querySelector('#similar1 p').textContent = data.similar1.artist || 'Unknown Artist';
    document.querySelector('#similar2 img').src = data.similar2.coverart || fallbackimg;
    document.querySelector('#similar2').setAttribute('data-videoid', data.similar2.videoid);
    document.querySelector('#similar2 h3').textContent = data.similar2.title || 'Unknown Title';
    document.querySelector('#similar2 p').textContent = data.similar2.artist || 'Unknown Artist';
    document.querySelector('#similar3 img').src = data.similar3.coverart || fallbackimg;
    document.querySelector('#similar3').setAttribute('data-videoid', data.similar3.videoid);
    document.querySelector('#similar3 h3').textContent = data.similar3.title || 'Unknown Title';
    document.querySelector('#similar3 p').textContent = data.similar3.artist || 'Unknown Artist';
    audioElement.pause();
    if (isPlaying) togglePlay();
    songFetched = false;
    fetchUrl(data.mainsong.videoid);
}
document.addEventListener('DOMContentLoaded', fetchSongOnEmotion('starter'));

// Fetch Song on emotion
async function fetchSongOnEmotion(emotion) {
    const response = await fetch('/getsongs', {
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
        setSong(data)
        let re_note = (note[emotion] || '') + 'Playing for you ' + ' <b>' + data.mainsong.note + '</b>';
        if (emotion == 'sad') {
            let n = data.mainsong.note;
            let lastletter = n.charAt(n.length - 1);
            if (lastletter === 's') {
                data.mainsong.note = n.slice(0, n.length - 1); // Removing the last character if it's 's'
                re_note = note[emotion][1] + ' Playing for you ' + ' <b>' + data.mainsong.note + '</b>';
            } else {
                re_note = note[emotion][0] + ' Playing for you ' + ' <b>' + data.mainsong.note + '</b>';
            }
        }
        document.querySelector('#recommendation-note').innerHTML = re_note;
        const glow = setTimeout(() => {
            document.querySelector('b').classList.add('note-glow');
        }, 3e3);
    }).catch(error => {
        console.error("Error fetching data:", error);
    });
}
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
        audioElement.src = data.songurl;
        songFetched = true;
        if (loading == true) {
            audioElement.play();
            playButton.textContent = '⏸';
            loading = false;
            cameraONOFF('off');
        }
        setTimeout(() => {
            updateSlider('reset');
        }, 1e3);
    }).catch(error => {
        console.error("Error fetching data:", error);
    });
}

//Similar Track Play
async function similarsongclick(id) {
    videoid = document.querySelector(id).getAttribute('data-videoid');
    artists = document.querySelector(id).querySelector('p').innerText;
    const response = await fetch('/continuesongs', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            'videoid': videoid,
            'artists': artists
        }),
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }).then(data => {
        console.log("Received data:", data);
        setSong(data);
    }).catch(error => {
        console.error("Error fetching similar songs:", error);
    });
}
var camonsvg = `<svg fill="#ffffff" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="800px" height="800px" viewBox="0 0 487.811 487.811" xml:space="preserve"><g><g><polygon points="0,124.814 0,124.814 0,124.805"/><path d="M487.592,118.178l-1.425-1.521c-0.794-0.851-2.247-1.874-4.657-1.874l-77.169,0.067c-2.229,0-7.43-6.101-9.209-11.733
             l-16.639-47.392c-2.477-7.889-10.49-7.889-13.502-7.889l-181.238,0.077l-3.691-0.029c-3.825,0-12.785,0-15.195,8.319
             l-14.564,51.102c-1.1,3.806-5.508,7.545-8.902,7.545l-121.473-0.019c-7.449,0-19.918,0-19.928,9.974
             c0.01-5.69,14.563-0.517,24.604-0.411l116.796,0.019c5.852,0,11.886-6.655,13.493-12.192l14.563-52.316
             c1.559-5.384,8.052-2.61,13.789-2.458l176.974,0.029H183.753c-0.163,0-0.334,0-0.497,0c-5.728,0-12.23-2.936-13.789,2.438
             l-14.564,52.316c-1.597,5.518-7.612,12.135-13.435,12.183c8.558-0.038,16.017-7.506,18.025-14.458l14.563-51.083l-14.563,51.093
             c-2.018,6.952-9.505,14.449-18.092,14.449l0,0c0.019,0,0.038,0,0.057,0c-0.019,0-0.038,0-0.057,0l0,0l0,0l0,0H24.93
             c-0.105,0-0.22,0-0.325,0c-10.041,0-24.595-5.288-24.604,0.401c0,0,0-0.009,0,0v287.229l0,0c0,23.084,13.56,27.932,24.93,27.932
             l0,0l0,0h451.102c2.878,0,5.412-1.041,7.354-3.031c4.771-4.896,4.532-14.314,4.351-21.199c-0.038-1.367-0.048-2.602-0.048-3.701
             V121.171L487.592,118.178z M478.173,415.982c0.048,1.998,0.134,5.068-0.048,7.879C478.307,421.051,478.221,417.98,478.173,415.982
             c-0.038-1.482-0.048-2.811-0.048-3.93c0,0,0-0.01,0-0.02v-0.096c0,0.029,0,0.086,0,0.115
             C478.105,413.172,478.135,414.5,478.173,415.982z M404.341,124.413L404.341,124.413
             C404.341,124.413,404.331,124.413,404.341,124.413L404.341,124.413z M274.922,148.319c59.412,0,107.578,48.167,107.578,107.578
             c0,59.412-48.166,107.578-107.578,107.578c-59.412,0-107.578-48.166-107.578-107.578
             C167.344,196.485,215.51,148.319,274.922,148.319z"/></g></g></svg>`;
var camoffsvg = `<svg fill="#ffffff" width="800px" height="800px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 20h11.879l-3.083-3.083A4.774 4.774 0 0 1 12 17c-2.71 0-5-2.29-5-5 0-.271.039-.535.083-.796L2.144 6.265C2.054 6.493 2 6.74 2 7v11c0 1.103.897 2 2 2zM20 5h-2.586l-2.707-2.707A.996.996 0 0 0 14 2h-4a.996.996 0 0 0-.707.293L6.586 5h-.172L3.707 2.293 2.293 3.707l18 18 1.414-1.414-.626-.626A1.98 1.98 0 0 0 22 18V7c0-1.103-.897-2-2-2zm-5.312 8.274A2.86 2.86 0 0 0 15 12c0-1.626-1.374-3-3-3-.456 0-.884.12-1.274.312l-1.46-1.46A4.88 4.88 0 0 1 12 7c2.71 0 5 2.29 5 5a4.88 4.88 0 0 1-.852 2.734l-1.46-1.46z"/></svg>`;

function cameraONOFF(action) {
    const tg = document.querySelector('.camera-toggle');
    if ((action == 'auto' || action == 'on') && video.paused) {
        tg.innerHTML = camonsvg;
        video.play();
    } else if ((action == 'auto' || action == 'off')) {
        video.pause();
        tg.innerHTML = camoffsvg;
    }
}

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

async function lyrics(){
    const idforlyrics = document.querySelector('.player img').getAttribute('data-videoid');
    const lyrics = await fetch('/songlyrics', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            'videoid': idforlyrics
        }),
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }).then(data => {
        console.log("Received data:", data);
        document.querySelector('.lyrics-panel p').innerText = data.lyrics;
    }).catch(error => {
        console.error("Error fetching similar songs:", error);
    });
}

let lyricVisible = false;
function lyricToggle(){
if(lyricVisible){document.querySelector('.lyrics-panel').style.display = 'none'; cameraONOFF('on'); lyricVisible = false;}
else{lyrics(); document.querySelector('.lyrics-panel').style.display = 'flex'; cameraONOFF('off'); lyricVisible=true;}
}