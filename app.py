from flask import Flask, request, render_template, jsonify
from musicapi import get_song_recommendation, fetch_related_songs, fetch_song_url, search_song, song_lyrics

app = Flask(__name__)


# Home Page
@app.route('/', methods=['GET'])
def homepage():
    return render_template('index.html')


# Recommendation Route
@app.route('/recommendation', methods=['POST'])
def recommendation():
    try:
        data = request.json
        emotion = data.get('emotion')
        songrecommendation = get_song_recommendation(emotion)
        return jsonify(songrecommendation), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Similar Song Route
@app.route('/similar', methods=['POST'])
def continuesongs():
    try:
        data = request.json
        videoid = data.get('videoid')
        similars = fetch_related_songs(videoid)
        return jsonify(similars), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Song Url Route
@app.route('/songurl', methods=['POST'])
async def songurl():
    try:
        data = request.json
        videoid = data.get('videoid')
        # Picking right id for particular songs that have wrong top result
        if videoid == 'T7xmqisFI-Y':
            videoid = 'EEqq0_Etuos'
        song_info = await fetch_song_url(videoid)
        song_url = song_info.get('url', '')
        return jsonify({'songurl': song_url, 'videoid': videoid}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Search Route  
@app.route('/search', methods=['POST'])
def search():
    try:
        req = request.json
        query = req.get('query')
        search_result = search_song(query)
        return jsonify(search_result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Lyrics Route
@app.route('/lyrics', methods=['POST'])
def songlyrics():
    try:
        data = request.json
        videoid = data.get('videoid')
        lyrics = song_lyrics(videoid)
        return jsonify({'lyrics': lyrics}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Start and Run App
if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True,threaded=True)