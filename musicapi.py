from ytmusicapi import YTMusic
from yt_dlp import YoutubeDL
from scrape import emotion_query
import asyncio

ytmusic = YTMusic()


def get_song_recommendation(emotion):
    try:
        search_query, songnote = emotion_query(emotion)
        search_results = ytmusic.search(str(search_query), filter="songs")
        if search_query == 'Olithu Maadu Manusa-C Ashwath':
            search_results = ytmusic.search(str(search_query))

        if not search_results:
            return {"error": "No songs found"}
        mainsong = search_results[0]

        ans = {
            "title": mainsong.get("title","Unknown Song"),
            "artists": ", ".join([artist.get("name", "Unknown Artist") for artist in mainsong.get("artists", [])]),
            "coverart": mainsong["thumbnails"][0]["url"].split('=')[0],
            "videoid": mainsong.get("videoId"),
            "note": songnote
            }
        return ans
    
    except Exception as e:
        return {"error": f"Failed to get song recommendation {e}"}



def search_song(search_query):
    try:
        search_results = ytmusic.search(str(search_query), filter="songs")
        if not search_results:
            return {"error": "No songs found"}
        data = search_results[0]
        coverurl = data["thumbnails"][0]["url"]
        return {
            "title": data.get("title","Unknown Song"),
            "artists": ", ".join([artist.get("name", "Unknown Artist") for artist in data.get("artists", [])]),
            "coverart": coverurl.split('=')[0],
            "videoid": data.get("videoId"),
            }

    except Exception as e:
        return {"error": f"Failed to search song for query {search_query}"}



def fetch_related_songs(video_id):
    try:
        watch_playlist = ytmusic.get_watch_playlist(videoId=video_id, limit=5)
        tracks = watch_playlist.get("tracks", [])
        if not tracks:
            return {"error": "No related tracks found"}
        ans = {
            "similar1": format_track(tracks[1]),
            "similar2": format_track(tracks[2]),
            "similar3": format_track(tracks[3])
        }
        return ans

    except Exception as e:
        return {"error": "Failed to fetch related songs"}



def format_track(track):
        if not track:
            return {"title": "N/A", "artist": "N/A", "coverart": "", "videoid": ""}
        
        coverurl = track["thumbnail"][0]["url"]
        return {
            "title": track.get("title", "Unknown Title"),
            "artists": ", ".join([artist.get("name", "Unknown Artist") for artist in track.get("artists", [])]),
            "coverart": coverurl.split('=')[0],
            "videoid": track.get("videoId", "")
        }



async def fetch_song_url(videoid):
    try:
        ydl_opts = {
            'format': 'bestaudio',
            'noplaylist': True,
            'quiet': True,
            'simulate': True,
            'forceurl': True,
        }
        songinfo = await asyncio.to_thread(run_yt_dlp, videoid, ydl_opts)
        return songinfo

    except Exception as e:
        return {"error": "Failed to fetch song URL"}

def run_yt_dlp(videoid, ydl_opts):
    with YoutubeDL(ydl_opts) as ydl:
        return ydl.extract_info(f'https://youtube.com/watch?v={videoid}')



def song_lyrics(videoid):
    watch_playlist = ytmusic.get_watch_playlist(videoId=videoid)
    lyrics_id = watch_playlist.get('lyrics')
    if not lyrics_id:
        return "Oh you caught us. \n We still don't have lyrics for this one."
    lyrics = ytmusic.get_lyrics(lyrics_id)
    return lyrics.get('lyrics', "Oh you caught us. \n We still don't have lyrics for this one.")