from ytmusicapi import YTMusic
from yt_dlp import YoutubeDL
import asyncio
from scrape import emotion_query

ytmusic = YTMusic()
songnote = ''

def get_song_recommendation(emotion):
    global songnote

    search_query, songnote= emotion_query(emotion)
    return search_song(search_query)


def search_song(search_query):
    search_results = ytmusic.search(str(search_query), filter="songs", limit=1)

    if (search_query=='Olithu Maadu Manusa-C Ashwath'):
        search_results = ytmusic.search(str(search_query), limit=1)

    mainsong = search_results[0]
    video_id = mainsong.get("videoId")
    songartists = ", ".join([artist.get("name", "Unknown Artist") for artist in mainsong.get("artists", [])])

    return fetch_related_songs(video_id, songartists)


def fetch_related_songs(video_id, songartists):
    global songnote

    song_details = ytmusic.get_song(video_id)
    watch_playlist = ytmusic.get_watch_playlist(videoId=video_id)

    tracks = watch_playlist["tracks"]
    similar_tracks = tracks[1:4]
    while len(similar_tracks) < 3:
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


def format_track(track):
    if not track:
        return {"title": "N/A", "artist": "N/A", "coverart": "", "videoid": ""}

    return {
        "title": track.get("title", "Unknown Title"),
        "artist": ", ".join([artist.get("name", "Unknown Artist") for artist in track.get("artists", [])]),
        "coverart": track['thumbnail'][2].get("url", ""),
        "videoid": track.get("videoId", "")
    }


async def fetch_song_url(videoid):
    ydl_opts = {
            'format': 'bestaudio',
            'noplaylist': True,
            'quiet': True,
            'simulate': True,
            'forceurl': True,
        }
    loop = asyncio.get_event_loop()
    with YoutubeDL(ydl_opts) as ydl:
        return await loop.run_in_executor(None, ydl.extract_info, f'https://youtube.com/watch?v={videoid}')
    

def song_lyrics(videoid):
    watch_playlist = ytmusic.get_watch_playlist(videoId=videoid)
    browse_id = watch_playlist.get('lyrics')
    if watch_playlist.get('lyrics') == None:
        return "Oh you caught us. \n We still don't have lyrics for this one."
    lyrics = ytmusic.get_lyrics(browse_id)
    return lyrics.get('lyrics')