from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import speech_recognition as sr
import requests
import numpy as np

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

GROQ_API_KEY = "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"
GROQ_MODEL = "llama3-70b-8192"

# Audio parameters
SAMPLE_RATE = 16000
SAMPLE_WIDTH = 2  # bytes (16-bit audio)
CHUNK_MS = 1000  # ms per buffer (matches JS)
SILENCE_THRESHOLD = 500  # Adjust if needed (lower = more sensitive)
SILENCE_DURATION_MS = 800  # How long of silence means "done speaking"

# Buffers for each client
audio_buffers = {}
silence_buffers = {}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('audio_chunk')
def handle_audio_chunk(data):
    sid = request.sid

    if sid not in audio_buffers:
        audio_buffers[sid] = b''
        silence_buffers[sid] = 0

    audio_buffers[sid] += data

    # Convert latest chunk to numpy array for energy check
    chunk = np.frombuffer(data, dtype=np.int16)
    energy = np.abs(chunk).mean()

    # Silence detection
    if energy < SILENCE_THRESHOLD:
        silence_buffers[sid] += CHUNK_MS
    else:
        silence_buffers[sid] = 0

    # Only transcribe after enough silence and enough audio collected
    if silence_buffers[sid] >= SILENCE_DURATION_MS and len(audio_buffers[sid]) > SAMPLE_RATE * SAMPLE_WIDTH:
        try:
            pcm_data = audio_buffers[sid]
            audio_buffers[sid] = b''
            silence_buffers[sid] = 0

            recognizer = sr.Recognizer()
            audio_data = sr.AudioData(pcm_data, sample_rate=SAMPLE_RATE, sample_width=SAMPLE_WIDTH)
            try:
                text = recognizer.recognize_google(audio_data)
            except sr.UnknownValueError:
                # No speech recognized, ignore and wait for more
                return

            emit('transcription', {'text': text})
            reply = query_llm(text)
            emit('reply', {'text': reply})
        except Exception as e:
            emit('error', {'error': str(e)})

def query_llm(text):
    headers = {
        'Authorization': f'Bearer {GROQ_API_KEY}',
        'Content-Type': 'application/json',
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": text}
        ]
    }
    response = requests.post('https://api.groq.com/openai/v1/chat/completions', headers=headers, json=payload)
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content']

if __name__ == '__main__':
    socketio.run(app, debug=True)
