import logging
import warnings
import asyncio
from ytmusicapi import YTMusic
from yt_dlp import YoutubeDL
from scrape import emotion_query

# Suppress specific warnings
warnings.filterwarnings("ignore", category=UserWarning, message="some yt attributes must be missing")

# Initialize YTMusic and logging
ytmusic = YTMusic()
songnote = ''
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

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
        song_details = ytmusic.get_song(video_id)
        watch_playlist = ytmusic.get_watch_playlist(videoId=video_id)

        if not watch_playlist or "tracks" not in watch_playlist:
            logger.warning(f"No related tracks found for video_id: {video_id}")
            return {"error": "No related tracks found"}

        tracks = watch_playlist["tracks"]
        similar_tracks = tracks[1:4]  # Get 3 similar tracks
        while len(similar_tracks) < 3:  # Fallback in case there are fewer than 3 tracks
            similar_tracks.append({})

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
        loop = asyncio.get_event_loop()
        with YoutubeDL(ydl_opts) as ydl:
            result = await loop.run_in_executor(None, ydl.extract_info, f'https://youtube.com/watch?v={videoid}')
            return result
    except Exception as e:
        logger.error(f"Error in fetch_song_url for video_id {videoid}: {e}")
        return {"error": "Failed to fetch song URL"}

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
