Real-Time AI Voice Chat

A web app for real-time, streaming voice chat with an AI assistant. Speak into your microphone, and get instant AI-powered responses—no need to wait for uploads or manual stops.
Built with Flask, Flask-SocketIO, JavaScript, and the Groq LLM API.

---

Features

- Real-time streaming audio from browser to server
- Automatic silence detection (no need to click "stop"—just pause speaking)
- Speech-to-text transcription using Google Speech Recognition
- AI chat responses using Groq's LLM API
- Text-to-speech playback of AI replies in the browser

---

Project Structure

project/
├── app.py
├── requirements.txt
├── README.md
├── templates/
│   └── index.html
├── static/
│   ├── script.js
│   └── styles.css

---

Setup Instructions

1. Clone the repository

2. Install dependencies

Create a virtual environment (optional but recommended):

python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

Install Python dependencies:

pip install -r requirements.txt

If you don’t have a requirements.txt, use:

pip install flask flask-socketio eventlet speechrecognition numpy requests

3. Set your Groq API key

Open app.py and set your GROQ_API_KEY variable with your Groq API key (https://console.groq.com/).

4. Run the server

python app.py

5. Open the app in your browser

Go to http://localhost:5000

---

Usage

1. Click Start Recording.
2. Ask your question or speak to the AI.
3. Pause for a moment—your speech will be transcribed and sent to the AI.
4. Hear and see the AI’s response instantly.
5. Click Stop Recording to end.

---

Customization

- Silence detection threshold and timing can be adjusted in app.py:
    - SILENCE_THRESHOLD (energy level, lower = more sensitive)
    - SILENCE_DURATION_MS (how long to wait before transcribing)
- Change the AI model by editing GROQ_MODEL in app.py.

---

Troubleshooting

- If you see errors about numpy, install it: pip install numpy
- For speech recognition to work, your server needs internet access (Google STT API).
- If you get "Audio conversion failed", make sure you’re using the latest code (PCM streaming, not WebM).

---

Credits

- Flask (https://flask.palletsprojects.com/)
- Flask-SocketIO (https://flask-socketio.readthedocs.io/)
- SpeechRecognition (https://pypi.org/project/SpeechRecognition/)
- Groq LLM API (https://console.groq.com/)
- Socket.IO (https://socket.io/)
- Web Audio API (https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

License

MIT License

---

Enjoy chatting with your AI assistant in real time!
