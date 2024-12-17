import logging
import asyncio
from flask import Flask, request, render_template, jsonify
from musicapi import get_song_recommendation, fetch_related_songs, fetch_song_url, search_song, song_lyrics

# Initialize Flask app and logger
app = Flask(__name__)

# Set up logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

@app.route('/', methods=['GET'])
def homepage():
    logger.info("Homepage accessed.")
    return render_template('index.html')


@app.route('/getsongs', methods=['POST'])
def getsongs():
    try:
        data = request.json
        emotion = data.get('emotion')

        if not emotion:
            logger.warning("Emotion is missing in request.")
            return jsonify({'error': 'Emotion is required'}), 400

        logger.info(f"Received emotion: {emotion}")
        music_json = get_song_recommendation(emotion)

        if not music_json:
            logger.warning("get_song_recommendation returned None.")
            return jsonify({'error': 'get_song_recommendation returned None'}), 500

        logger.info(f"Returning song recommendations for emotion: {emotion}")
        return jsonify(music_json), 200

    except Exception as e:
        logger.error(f"Error in /getsongs: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/continuesongs', methods=['POST'])
def continuesongs():
    try:
        data = request.json
        videoid = data.get('videoid')
        artists = data.get('artists')

        if not videoid:
            logger.warning("Video ID is missing in request.")
            return jsonify({'error': 'videoid is required'}), 400

        logger.info(f"Received request for continuing songs with video ID: {videoid} and artists: {artists}")
        musicnext_json = fetch_related_songs(videoid, artists)

        logger.info(f"Returning related songs for video ID: {videoid}")
        return jsonify(musicnext_json), 200

    except Exception as e:
        logger.error(f"Error in /continuesongs: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/songurl', methods=['POST'])
async def songurl():
    try:
        data = request.json
        videoid = data.get('videoid')

        if not videoid:
            logger.warning("Video ID is missing in request.")
            return jsonify({'error': 'videoid is required'}), 400

        # Handle specific case for Pushpa song
        if videoid == 'T7xmqisFI-Y':
            logger.info("Handling special case for Pushpa song.")
            videoid = 'EEqq0_Etuos'

        logger.info(f"Fetching song URL for video ID: {videoid}")
        song_info = await fetch_song_url(videoid)
        song_url = song_info.get('url', '')

        logger.info(f"Returning song URL for video ID: {videoid}")
        return jsonify({'songurl': song_url}), 200

    except Exception as e:
        logger.error(f"Error in /songurl: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/search', methods=['POST'])
def search():
    try:
        req = request.json
        query = req.get('query')

        if not query:
            logger.warning("Search term is missing in request.")
            return jsonify({'error': 'specify search term'}), 400

        logger.info(f"Searching for song with query: {query}")
        search_result = search_song(query)

        logger.info(f"Returning search results for query: {query}")
        return jsonify(search_result), 200

    except Exception as e:
        logger.error(f"Error in /search: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/songlyrics', methods=['POST'])
def songlyrics():
    try:
        data = request.json
        videoid = data.get('videoid')

        if not videoid:
            logger.warning("Video ID is missing in request.")
            return jsonify({'error': 'We need Videoid to fetch lyrics'}), 400

        logger.info(f"Fetching lyrics for video ID: {videoid}")
        lyrics = song_lyrics(videoid)

        logger.info(f"Returning lyrics for video ID: {videoid}")
        return jsonify({'lyrics': lyrics}), 200

    except Exception as e:
        logger.error(f"Error in /songlyrics: {e}")
        return jsonify({'error': str(e)}), 500


# Run the Flask app
if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, threaded=True)
