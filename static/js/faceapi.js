//constants
var cooldowntime = false;
var lastcaptured='happy';
var dominantExpression = 'starter';
var emoji = {
    'neutral': '😇 CALM',
    'happy': '😊 JOY',
    'surprised': '😮 SURPRISED',
    'sad': '😭 SAD',
    'angry': '😤 ANGRY',
}
var isThrowing= false;
let prevDominant = 'starter';
let inView = true;
const video = document.getElementById('video')

// Download all Models of FaceApi
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/static/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/static/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/static/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/static/models')
]).then(startVideo)


// Get Camera Resource
function startVideo() {
    navigator.getUserMedia({
            video: {}
        },
        stream => video.srcObject = stream,
        err => console.error(err)
    )
}


// Start detection on videocam ready and Keep Predicting Emotions every 200ms
let firstvideoplay = true;
video.addEventListener('play', () => {
    if (!firstvideoplay)
        return;
    // Setting Up for detections
    const canvas = faceapi.createCanvasFromMedia(video);
    canvas.setAttribute('class', 'canvas-photo');
    document.querySelector('#video-container').append(canvas);
    const displaySize = {
        width: video.width,
        height: video.height
    };
    faceapi.matchDimensions(canvas, displaySize);
    // Remove Blur Mask on Video Ready
    const gradientEnd = setTimeout(function() {
        document.querySelector('#video-container').classList.remove('gradient');
        document.querySelector('.camera-toggle').style.transform = 'scale(1)';
        document.querySelector('#video-container').style.maxWidth = '600px';
        document.querySelector('.recommend-button').style.zIndex = 0;
        document.querySelector('.recommend-button').style.backgroundColor = '#060026';
        document.querySelector('.recommend-button>div').style.backgroundColor = '#060026';
        document.querySelector('.recommend-button p').style.color = '#fff';
        document.querySelector('.recommend-button p').style.fontWeight = 'bold';
    }, 3e3);
    firstvideoplay = false;
    // Detect Emotions every 200ms
    setInterval(async () => {
        if (inView == true && cooldowntime == false && video.paused == false) {
            // Detect the face with expressions
            const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
            if (detections) {
                // Resize the detections to match the video dimensions
                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                // Clear the canvas before drawing new detections
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                // Get the face expression with the highest probability
                const expression = detections.expressions;
                setDominantEmotion(expression);
                const confidence = (expression[dominantExpression] * 100).toFixed(1); // Confidence in percentage
                // Draw a box around the face
                const box = resizedDetections.detection.box;
                const ctx = canvas.getContext('2d');
                ctx.strokeStyle = 'rgba(1, 1, 1, 0.8)'; // Green box around the face
                ctx.lineWidth = 2;
                ctx.strokeRect(box.x, box.y, box.width, box.height);
                // Display the current emotion and its confidence inside the box
                if (dominantExpression == 'disgusted') {
                    dominantExpression = 'sad';
                }
                if (dominantExpression == 'fearful') {
                    dominantExpression = 'sad';
                }
                if (false && dominantExpression == 'neutral' && prevDominant != 'angry' && confidence<95) {
                    dominantExpression = 'sad';
                }
                prevDominant = dominantExpression;
                ctx.fillStyle = 'rgba(255, 255, 255, 1)';
                ctx.font = '16px open sans';
                ctx.fillText(`${emoji[dominantExpression]} : ${confidence}%`, box.x + 10, box.y + 20);
            }
        }
    }, 200);
});


// Intersection Observer for VideoFeed Visiblity
function handleIntersection(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            inView = true;
        } else {
            inView = false;
        }
    });
}
const observer = new IntersectionObserver(handleIntersection, {
    root: null,
    threshold: 0.3 
});
observer.observe(video);


// Pause Detections for few seconds using 'cooldowntime' when required (like just after a recommendation)
let cool;
function cooldown(bool) {
    if (bool == 0) {
        cooldowntime = true;
        cameraONOFF('off');
        if (cool) {
            clearTimeout(cool);
        }
        cool = setTimeout(function() {
            cooldowntime = false;
            cameraONOFF('on');
        }, 5e3);
    }
    if (bool == 1) {
        cooldowntime = false;
        cameraONOFF('on');
        if (cool) {
            clearTimeout(cool);
        }
    }
}


// Decide Dominant Emotion from Detection Emotion Scores
function setDominantEmotion(expressions) {
    dominantExpression = Object.keys(expressions).reduce((maxEmotion, currentEmotion) =>
        expressions[currentEmotion] > expressions[maxEmotion] ? currentEmotion : maxEmotion
    );
}


// Recommend Button
function recommend() {
    cooldown(0);
    lastcaptured = dominantExpression;
    document.querySelector('.recommend-button').classList.add('recommend-button-click');
    const clickclick = setTimeout(function(){document.querySelector('.recommend-button').classList.remove('recommend-button-click');},1e3);
    if (isPlaying) togglePlay();
    generatePhoto();
    updateSlider('reset');
    throwPhoto();
    fetchSongOnEmotion(dominantExpression);
}


// Generate Photo when photo clicked
function generatePhoto() {
    const vd = document.querySelector('video');
    const canv = document.createElement('canvas');
    const conx = canv.getContext('2d');
    canv.width = vd.videoWidth;
    canv.height = vd.videoHeight;
    conx.drawImage(vd, 0, 0, canv.width, canv.height);
    const img_src = canv.toDataURL('image/jpeg');
    const boxCanvas = document.querySelector('.canvas-photo');
    const box_src = boxCanvas.toDataURL('image/png');
    document.querySelector('#photograph').src = img_src;
    document.querySelector('#face-box').src = box_src;
}


// Throw the photo up in air
function throwPhoto() {
    isThrowing = true;
    const photo = document.querySelector('#clicked-photo');
    document.querySelector('.camera-toggle').style.transform = 'scale(0)';
    document.querySelector('#video-container').classList.remove('smooth-transition');
    document.querySelector('#video-container').classList.add('gradient');
    photo.classList.add('clicked-photo-animation');
    const removeAll = setTimeout(function() {
        document.querySelector('#video-container').classList.add('smooth-transition');
        document.querySelector('#video-container').classList.remove('gradient');
        document.querySelector('.camera-toggle').style.transform = 'scale(1)';
        photo.classList.remove('clicked-photo-animation');
        isThrowing= false;
    }, 4e3);
}


// Reload Page on logo click
function reload(){
  window.location.href= '/';
}

// Snap to Main section
function snap() {
    window.location.href = '#panels';
}

// Camera-Feed ON-OFF Button (Just pauses videostream. Doesn't release camera resources)
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

// Hard stop the camera (This is currently used only when play/pause button is clicked in music player)
let mediaStream;
async function startCamera() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Attach mediaStream to a video element
        const videoElement = document.getElementById('video');
        videoElement.srcObject = mediaStream;
        document.querySelector('#video-container').classList.remove('gradient');
    } catch (error) {
        console.error('Error accessing the camera:', error);
    }
}

// Hard start the camera
function stopCamera() {
    if (mediaStream) {
        // Stop all tracks
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;  // Clear the mediaStream object
        document.querySelector('#video-container').classList.add('gradient');
    }
}