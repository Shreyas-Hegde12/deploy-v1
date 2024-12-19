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
        musicnext_json = fetch_related_songs(videoid, artists)
        return jsonify(musicnext_json), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/songurl', methods=['POST'])
async def songurl():
    try:
        data = request.json
        videoid = data.get('videoid')

        # Pushpa
        if videoid == 'T7xmqisFI-Y':
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
        search_result = search_song(query)
        return jsonify(search_result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/songlyrics', methods=['POST'])
def songlyrics():
    try:
        data = request.json
        videoid = data.get('videoid')

        lyrics = song_lyrics(videoid)
        return jsonify({'lyrics': lyrics}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)