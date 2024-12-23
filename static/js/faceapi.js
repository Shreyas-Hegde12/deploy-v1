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
    }, 2e3);
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
        cool = setTimeout(function() {
            cooldowntime = false;
            cameraONOFF('on');
        }, 3e3);
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
    lastcaptured = dominantExpression;
    document.querySelector('.recommend-button').classList.add('recommend-button-click');
    const clickclick = setTimeout(function(){document.querySelector('.recommend-button').classList.remove('recommend-button-click');},1e3);
    document.querySelector('.recommend-button').style.zIndex = 0;
    document.querySelector('.recommend-button').style.backgroundColor = '#060026';
    document.querySelector('.recommend-button>div').style.backgroundColor = '#060026';
    document.querySelector('.recommend-button p').style.color = '#fff';
    document.querySelector('.recommend-button p').style.fontWeight = 'bold';
    if (isPlaying) togglePlay();
    fetchSongOnEmotion(dominantExpression);
    generatePhoto();
    updateSlider('reset');
    throwPhoto();
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
    const photo = document.querySelector('#clicked-photo');
    document.querySelector('.camera-toggle').style.transform = 'scale(0)';
    document.querySelector('#video-container').classList.remove('smooth-transition');
    document.querySelector('#video-container').classList.add('gradient');
    photo.classList.add('clicked-photo-animation');
    const removeall = setTimeout(function() {
        photo.classList.remove('clicked-photo-animation');
        document.querySelector('#video-container').classList.add('smooth-transition');
        document.querySelector('#video-container').classList.remove('gradient');
        document.querySelector('.camera-toggle').style.transform = 'scale(1)';
        cooldown(0);
    }, 3e3);
}


// Reload Page on logo click
function reload(){
  window.location.href= '/';
}

// Snap to Main section
function snap() {
    window.location.href = '#panels';
}
