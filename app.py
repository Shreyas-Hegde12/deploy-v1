import logging
from flask import Flask, request, render_template, jsonify
from musicapi import get_song_recommendation, fetch_related_songs, fetch_song_url, search_song, song_lyrics

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO,  # Adjust the level to DEBUG for more details
                    format='%(asctime)s - %(levelname)s - %(message)s')

# Set up a logger
logger = logging.getLogger(__name__)

# Before request hook for logging incoming requests
@app.before_request
def log_request_info():
    logger.info(f"Request URL: {request.url} | Method: {request.method} | Headers: {request.headers}")

# After request hook for logging responses
@app.after_request
def log_response_info(response):
    logger.info(f"Response Status: {response.status} | Response Body: {response.get_data(as_text=True)}")
    return response

@app.route('/', methods=['GET'])
def homepage():
    try:
        return render_template('index.html')
    except Exception as e:
        logger.error(f"Error rendering homepage: {e}")
        return jsonify({'error': 'Error rendering homepage'}), 500


@app.route('/getsongs', methods=['POST'])
def getsongs():
    try:
        data = request.json
        emotion = data.get('emotion')
        if not emotion:
            logger.warning("Missing 'emotion' in the request")
            return jsonify({'error': 'Emotion is required'}), 400
        
        logger.info(f"Received emotion: {emotion}")
        music_json = get_song_recommendation(emotion)
        
        if music_json is None:
            logger.error(f"get_song_recommendation returned None for emotion: {emotion}")
            return jsonify({'error': 'No song recommendations found'}), 500
        
        return jsonify(music_json), 200
    
    except Exception as e:
        logger.error(f"Error in /getsongs endpoint: {e}")
        return jsonify({'error': f"Internal Server Error: {str(e)}"}), 500


@app.route('/continuesongs', methods=['POST'])
def continuesongs():
    try:
        data = request.json
        videoid = data.get('videoid')
        artists = data.get('artists')
        
        if not videoid:
            logger.warning("Missing 'videoid' in the request")
            return jsonify({'error': 'videoid is required'}), 400
        
        logger.info(f"Received videoid: {videoid}, artists: {artists}")
        musicnext_json = fetch_related_songs(videoid, artists)
        
        if musicnext_json is None:
            logger.error(f"fetch_related_songs returned None for videoid: {videoid}")
            return jsonify({'error': 'No related songs found'}), 500
        
        return jsonify(musicnext_json), 200
    
    except Exception as e:
        logger.error(f"Error in /continuesongs endpoint: {e}")
        return jsonify({'error': f"Internal Server Error: {str(e)}"}), 500


@app.route('/songurl', methods=['POST'])
async def songurl():
    try:
        data = request.json
        videoid = data.get('videoid')
        
        if not videoid:
            logger.warning("Missing 'videoid' in the request")
            return jsonify({'error': 'videoid is required'}), 400
        
        # Special case for specific videoid
        if videoid == 'T7xmqisFI-Y':
            videoid = 'EEqq0_Etuos'
            logger.info(f"Videoid corrected to: {videoid}")
        
        song_info = await fetch_song_url(videoid)
        song_url = song_info.get('url', '')
        
        if not song_url:
            logger.error(f"Failed to fetch song URL for videoid: {videoid}")
            return jsonify({'error': 'Failed to fetch song URL'}), 500
        
        return jsonify({'songurl': song_url}), 200
    
    except Exception as e:
        logger.error(f"Error in /songurl endpoint: {e}")
        return jsonify({'error': f"Internal Server Error: {str(e)}"}), 500


@app.route('/search', methods=['POST'])
def search():
    try:
        req = request.json
        query = req.get('query')
        
        if not query:
            logger.warning("Missing 'query' in the search request")
            return jsonify({'error': 'specify search term'}), 400
        
        logger.info(f"Search query: {query}")
        searchResult = search_song(query)
        
        if not searchResult:
            logger.error(f"No search results for query: {query}")
            return jsonify({'error': 'No results found'}), 404
        
        return jsonify(searchResult), 200
    
    except Exception as e:
        logger.error(f"Error in /search endpoint: {e}")
        return jsonify({'error': f"Internal Server Error: {str(e)}"}), 500


@app.route('/songlyrics', methods=['POST'])
def songlyrics():
    try:
        data = request.json
        videoid = data.get('videoid')
        
        if not videoid:
            logger.warning("Missing 'videoid' in the lyrics request")
            return jsonify({'error': 'We need Videoid to fetch lyrics'}), 400
        
        logger.info(f"Fetching lyrics for videoid: {videoid}")
        lyrics = song_lyrics(videoid)
        
        if not lyrics:
            logger.error(f"Failed to fetch lyrics for videoid: {videoid}")
            return jsonify({'error': 'Failed to fetch lyrics'}), 500
        
        return jsonify({'lyrics': lyrics}), 200
    
    except Exception as e:
        logger.error(f"Error in /songlyrics endpoint: {e}")
        return jsonify({'error': f"Internal Server Error: {str(e)}"}), 500


# Run the application
if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, threaded=True)
