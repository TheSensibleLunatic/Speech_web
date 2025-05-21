class SpeechToText {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.audioStream = null;
        this.maxRecordingTime = 30000;

        this.recordBtn = document.getElementById('recordBtn');
        this.resultDiv = document.getElementById('result');
        this.timerDiv = document.createElement('div');
        this.timerDiv.className = 'timer';
        this.recordBtn.parentNode.insertBefore(this.timerDiv, this.recordBtn.nextSibling);

        this.recordingTimeout = null;
        this.startTime = null;

        this.init();
    }

    init() {
        this.recordBtn.addEventListener('click', () => this.toggleRecording());
    }

    async toggleRecording() {
        if (!this.isRecording) {
            await this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    async startRecording() {
        try {
            this.resetState();
            this.updateUI('Initializing microphone...', 'initializing');

            this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.audioStream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => this.handleRecordingStop();

            this.mediaRecorder.start(100);
            this.isRecording = true;
            this.startTime = Date.now();
            this.updateTimer();
            this.recordingTimeout = setTimeout(() => this.stopRecording(), this.maxRecordingTime);

            this.updateUI('Recording... Speak now!', 'recording');
            this.recordBtn.textContent = 'Stop Recording';
        } catch (error) {
            this.updateUI(this.getUserFriendlyError(error), 'error');
            this.cleanup();
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            clearTimeout(this.recordingTimeout);
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.updateUI('Processing audio...', 'processing');
        }
    }

    async handleRecordingStop() {
        try {
            if (this.audioChunks.length === 0) throw new Error('No audio data recorded');

            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            // Send audio to /transcribe
            const response = await fetch('/transcribe', { method: 'POST', body: formData });

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Invalid JSON response from /transcribe: ${text.substring(0, 200)}`);
            }

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Transcription failed');

            const transcript = data.text;
            this.updateUI("You: " + transcript, 'success');
            this.speakText("Processing response...");

            // Send transcript to /chat
            const chatResponse = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: transcript })
            });

            const chatContentType = chatResponse.headers.get('content-type') || '';
            if (!chatContentType.includes('application/json')) {
                const text = await chatResponse.text();
                throw new Error(`Invalid JSON response from /chat: ${text.substring(0, 200)}`);
            }

            const chatData = await chatResponse.json();
            if (!chatResponse.ok) throw new Error(chatData.error || 'Chat request failed');

            const reply = chatData.response || '[No response]';

            this.updateUI("AI: " + reply, 'success');
            this.speakText(reply);
        } catch (err) {
            this.updateUI(`Error: ${err.message}`, 'error');
        } finally {
            this.cleanup();
            this.recordBtn.textContent = 'Start Recording';
        }
    }

    speakText(text) {
        if (!window.speechSynthesis) {
            console.warn('Text-to-Speech not supported in this browser.');
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    }

    updateUI(message, state) {
        this.resultDiv.textContent = message;
        this.resultDiv.className = `result-box ${state}`;
    }

    updateTimer() {
        if (!this.isRecording) {
            this.timerDiv.textContent = '';
            return;
        }
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.timerDiv.textContent = `${elapsed}s`;
        setTimeout(() => this.updateTimer(), 200);
    }

    getUserFriendlyError(error) {
        if (error.name === 'NotAllowedError') return 'Microphone access denied.';
        if (error.name === 'NotFoundError') return 'No microphone found.';
        return error.message || 'Unknown error occurred.';
    }

    resetState() {
        this.audioChunks = [];
        this.timerDiv.textContent = '';
    }

    cleanup() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
        }
        clearTimeout(this.recordingTimeout);
        this.isRecording = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SpeechToText();
});
