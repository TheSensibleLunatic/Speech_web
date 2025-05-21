from flask import Flask, request, jsonify, render_template
from pydub import AudioSegment
import speech_recognition as sr
import io
import os
import requests

app = Flask(__name__)

# Replace this with your actual Groq API key
GROQ_API_KEY = "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"
GROQ_MODEL = "llama3-70b-8192"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file part'}), 400

    file = request.files['audio']
    if file.filename == '':
        return jsonify({'error': 'No selected audio file'}), 400

    try:
        audio = AudioSegment.from_file(file, format="webm")
        wav_io = io.BytesIO()
        audio.export(wav_io, format="wav")
        wav_io.seek(0)

        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_io) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
            return jsonify({'text': text})
    except Exception as e:
        return jsonify({'error': f'Failed to process audio: {str(e)}'}), 500

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_input = data.get('text')

    if not user_input:
        return jsonify({'error': 'No input text provided'}), 400

    headers = {
        'Authorization': f'Bearer {GROQ_API_KEY}',
        'Content-Type': 'application/json',
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": user_input}
        ]
    }

    try:
        response = requests.post('https://api.groq.com/openai/v1/chat/completions', headers=headers, json=payload)
        if response.status_code != 200:
            return jsonify({'error': f'LLM error: {response.status_code} - {response.text}'}), 500

        reply = response.json().get('choices', [{}])[0].get('message', {}).get('content', '')
        return jsonify({'response': reply})
    except Exception as e:
        return jsonify({'error': f'Exception during LLM call: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
