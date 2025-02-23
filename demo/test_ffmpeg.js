const vosk = require('vosk');
const fs = require("fs");
const { spawn } = require("child_process");

const MODEL_PATH = "vosk-model-small-en-us-0.15";
const FILE_NAME = "demo/test.mp3";
const SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4000;

if (!fs.existsSync(MODEL_PATH)) {
    console.log("Please download the model from https://alphacephei.com/vosk/models and unpack as " + MODEL_PATH + " in the current folder.");
    process.exit();
}

if (process.argv.length > 2) {
    FILE_NAME = process.argv[2];
}

vosk.setLogLevel(0);
const model = new vosk.Model(MODEL_PATH);
const rec = new vosk.Recognizer({ model: model, sampleRate: SAMPLE_RATE });

const ffmpeg_run = spawn('ffmpeg', [
    '-loglevel', 'quiet', '-i', FILE_NAME,
    '-ar', String(SAMPLE_RATE), // 设置采样率为 16kHz
    '-ac', '1', // 设置为单声道
    '-f', 's16le', // 输出格式为 16-bit PCM
    '-bufsize', String(BUFFER_SIZE), // 设置缓冲区大小
    '-'
]);

ffmpeg_run.stdout.on('data', (stdout) => {
    if (rec.acceptWaveform(stdout)) {
        console.log("result: ", rec.result());
    } else {
        console.log("partial: ", rec.partialResult());
    }
});

ffmpeg_run.stderr.on('data', (data) => {
    console.error("FFmpeg stderr: ", data.toString());
});

ffmpeg_run.on('close', (code) => {
    console.log("FFmpeg process exited with code: ", code);
    console.log("final: ", rec.finalResult());
});