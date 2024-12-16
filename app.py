from flask import Flask, request, render_template, jsonify
from musicapi import get_song_recommendation, fetch_related_songs, fetch_song_url, search_song, song_lyrics

app = Flask(__name__)


@app.route('/', methods=['GET'])
def homepage():
    return render_template('index.html')


@app.route('/getsongs', methods=['POST'])
def getsongs():
    try:
        data = request.json
        emotion = data.get('emotion')
        if not emotion:
            return jsonify({'error': 'Emotion is required'}), 400
        music_json = get_song_recommendation(emotion)
        return jsonify(music_json), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/continuesongs', methods=['POST'])
def continuesongs():
    try:
        data = request.json
        videoid = data.get('videoid')
        artists = data.get('artists')
        if not videoid:
            return jsonify({'error': 'videoid is required'}), 400
        musicnext_json = fetch_related_songs(videoid,artists)
        return jsonify(musicnext_json), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/songurl', methods=['POST'])
async def songurl():
    try:
        data = request.json
        videoid = data.get('videoid')
        if not videoid:
            return jsonify({'error': 'videoid is required'}), 400
        #Me Pushpa Fan
        if videoid=='T7xmqisFI-Y':
            videoid = 'EEqq0_Etuos'
        song_info = await fetch_song_url(videoid)
        song_url = song_info.get('url', '')
        return jsonify({'songurl': song_url}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/search', methods=['POST'])
def search():
    try:
        req = request.json
        query = req.get('query')
        if not query:
            return jsonify({'error': 'specify search term'}), 400
        searchResult = search_song(query)
        return jsonify(searchResult), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/songlyrics',methods=['POST'])
def songlyrics():
    try:
        data = request.json
        videoid = data.get('videoid')
        if not videoid:
            return jsonify({'error':'We need Videoid to fetch lyrics'}), 400
        lyrics = song_lyrics(videoid)
        return jsonify({'lyrics':lyrics}),200
    
    except Exception as e:
        return jsonify({'error':str(e)}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, threaded=True)
