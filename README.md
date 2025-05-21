# 🎙️ Speech-to-AI-to-Speech Web App (Groq LLaMA 3)

This Flask-based web app allows users to record their voice in the browser, transcribes the audio to text, sends the text to Groq’s LLaMA 3 language model, and then plays back the AI's response using the Web Speech API.

---

## 🔧 Tech Stack

- **Frontend**: HTML, CSS (Bootstrap), JavaScript (MediaRecorder, SpeechSynthesis)
- **Backend**: Python Flask, SpeechRecognition, Pydub
- **LLM**: Groq API (LLaMA 3)
- **Others**: WebM audio handling, JSON API requests

---

## 🚀 Features

- 🎤 Record voice from browser using MediaRecorder API  
- ✍️ Transcribe speech using Python SpeechRecognition  
- 🤖 Send text to Groq LLaMA 3 and receive a response  
- 🔊 Speak back the response using browser’s text-to-speech

---

## 📦 Setup Instructions

1. **Clone the repo:**
   ```bash
   git clone https://github.com/TheSensibleLunatic/Speech_web.git
   cd Speech_web
