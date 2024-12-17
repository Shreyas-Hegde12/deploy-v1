import logging
import warnings
import asyncio
from ytmusicapi import YTMusic
from yt_dlp import YoutubeDL
from scrape import emotion_query

# Suppress specific warnings
warnings.filterwarnings("ignore", category=UserWarning, message="some yt attributes must be missing")

# Initialize YTMusic and logging
ytmusic = YTMusic('browser.json')
songnote = ''
logger = logging.getLogger(__name__)

# Set up logging to both console and file
log_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
log_file = 'logs.log'

# Console handler (to print logs to console)
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)

# File handler (to save logs to a file)
file_handler = logging.FileHandler(log_file)
file_handler.setFormatter(log_formatter)

# Add handlers to logger
logger.addHandler(console_handler)
logger.addHandler(file_handler)

# Set log level to INFO (you can change this to DEBUG if needed)
logger.setLevel(logging.INFO)

def get_song_recommendation(emotion):
    global songnote
    try:
        search_query, songnote = emotion_query(emotion)
        logger.info(f"Search query for emotion '{emotion}': {search_query}")
        return search_song(search_query)
    except Exception as e:
        logger.error(f"Error in get_song_recommendation: {e}")
        return {"error": "Failed to get song recommendation"}

def search_song(search_query):
    try:
        logger.info(f"Searching for song: {search_query}")
        search_results = ytmusic.search(str(search_query), filter="songs", limit=1)

        # Special handling for specific song
        if search_query == 'Olithu Maadu Manusa-C Ashwath':
            search_results = ytmusic.search(str(search_query), limit=1)

        if not search_results:
            logger.warning(f"No search results found for query: {search_query}")
            return {"error": "No songs found"}

        mainsong = search_results[0]
        video_id = mainsong.get("videoId")
        songartists = ", ".join([artist.get("name", "Unknown Artist") for artist in mainsong.get("artists", [])])

        return fetch_related_songs(video_id, songartists)

    except Exception as e:
        logger.error(f"Error in search_song with query {search_query}: {e}")
        return {"error": f"Failed to search song for query {search_query}"}

def fetch_related_songs(video_id, songartists):
    global songnote
    try:
        logger.info(f"Fetching related songs for video_id: {video_id}, artists: {songartists}")
        
        # Fetch the song details
        song_details = ytmusic.get_song(video_id)
        watch_playlist = ytmusic.get_watch_playlist(videoId=video_id)
        
        # Ensure we get the tracks or provide a fallback
        tracks = watch_playlist.get("tracks", [])
        if not tracks:
            logger.warning(f"No related tracks found for video_id: {video_id}")
            return {"error": "No related tracks found"}
        
        similar_tracks = tracks[1:4]  # Get 3 similar tracks
        
        while len(similar_tracks) < 3:
            similar_tracks.append({})  # Fill in empty placeholders if fewer than 3 tracks

        return {
            "mainsong": {
                "title": song_details['videoDetails'].get("title", "Unknown Title"),
                "artist": songartists,
                "coverart": song_details['videoDetails']['thumbnail'].get("thumbnails", [{}])[-1].get("url", ""),
                "videoid": video_id,
                "note": songnote
            },
            "similar1": format_track(similar_tracks[0]),
            "similar2": format_track(similar_tracks[1]),
            "similar3": format_track(similar_tracks[2])
        }

    except Exception as e:
        logger.error(f"Error in fetch_related_songs for video_id {video_id}: {e}")
        return {"error": "Failed to fetch related songs"}

def format_track(track):
    try:
        if not track:
            return {"title": "N/A", "artist": "N/A", "coverart": "", "videoid": ""}
        
        return {
            "title": track.get("title", "Unknown Title"),
            "artist": ", ".join([artist.get("name", "Unknown Artist") for artist in track.get("artists", [])]),
            "coverart": track.get('thumbnail', [{}])[-1].get("url", ""),
            "videoid": track.get("videoId", "")
        }
    except Exception as e:
        logger.error(f"Error in format_track: {e}")
        return {"title": "Error", "artist": "Error", "coverart": "", "videoid": ""}

# Async function to fetch song URL
async def fetch_song_url(videoid):
    try:
        ydl_opts = {
            'format': 'bestaudio',
            'noplaylist': True,
            'quiet': True,
            'simulate': True,
            'forceurl': True,
        }

        # Using asyncio.to_thread to run the blocking yt-dlp code in a separate thread
        loop = asyncio.get_event_loop()
        song_info = await asyncio.to_thread(run_yt_dl, ydl_opts, videoid)

        return song_info

    except Exception as e:
        logger.error(f"Error in fetch_song_url: {e}")
        return {"error": "Failed to fetch song URL"}

def run_yt_dl(ydl_opts, videoid):
    with YoutubeDL(ydl_opts) as ydl:
        result = ydl.extract_info(f'https://youtube.com/watch?v={videoid}')
        return result

# Function to fetch song lyrics
def song_lyrics(videoid):
    try:
        logger.info(f"Fetching lyrics for video_id: {videoid}")
        watch_playlist = ytmusic.get_watch_playlist(videoId=videoid)
        browse_id = watch_playlist.get('lyrics')

        if not browse_id:
            logger.warning(f"No lyrics found for video_id: {videoid}")
            return "Oh you caught us. \n We still don't have lyrics for this one."

        lyrics = ytmusic.get_lyrics(browse_id)
        return lyrics.get('lyrics', "Lyrics not available")
    except Exception as e:
        logger.error(f"Error in song_lyrics for video_id {videoid}: {e}")
        return "Error fetching lyrics"
