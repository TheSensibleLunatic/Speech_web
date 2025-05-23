const socket = io();
const recordBtn = document.getElementById('recordBtn');
const resultDiv = document.getElementById('result');
let audioContext, processor, source, stream;

recordBtn.onclick = async () => {
    if (audioContext) {
        // Stop recording
        processor.disconnect();
        source.disconnect();
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        audioContext = null;
        recordBtn.textContent = "Start Recording";
        return;
    }

    // Start recording
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)({sampleRate: 16000});
    source = audioContext.createMediaStreamSource(stream);
    processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0); // Float32Array
        // Convert Float32Array [-1,1] to Int16Array
        const int16Buffer = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            let s = Math.max(-1, Math.min(1, inputData[i]));
            int16Buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        // Send as binary
        socket.emit('audio_chunk', int16Buffer.buffer);
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
    recordBtn.textContent = "Stop Recording";
};

socket.on('transcription', data => {
    resultDiv.textContent = "You: " + data.text;
});

socket.on('reply', data => {
    const reply = "AI: " + data.text;
    resultDiv.textContent += `\n${reply}`;
    speakText(data.text);
});

socket.on('error', err => {
    resultDiv.textContent = `Error: ${err.error}`;
});

function speakText(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}
