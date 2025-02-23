var vosk = require('..')

const fs = require("fs");
const { spawn } = require("child_process");

MODEL_PATH = "vosk-model-small-en-us-0.15"
FILE_NAME = "test.mp3"
SAMPLE_RATE = 16000
BUFFER_SIZE = 4000

console.log("Processing file:", FILE_NAME);

if (!fs.existsSync(MODEL_PATH)) {
    console.log("Please download the model from https://alphacephei.com/vosk/models and unpack as " + MODEL_PATH + " in the current folder.")
    process.exit()
}

console.log("Model loaded successfully:", MODEL_PATH);

if (process.argv.length > 2)
    FILE_NAME = process.argv[2]

vosk.setLogLevel(0);
const model = new vosk.Model(MODEL_PATH);
const rec = new vosk.Recognizer({model: model, sampleRate: SAMPLE_RATE});

const ffmpeg_run = spawn('ffmpeg', ['-loglevel', 'quiet', '-i', FILE_NAME,
                         '-ar', String(SAMPLE_RATE) , '-ac', '1',
                         '-f', 's16le', '-bufsize', String(BUFFER_SIZE) , '-']);

ffmpeg_run.stdout.on('data', (stdout) => {
    console.log("Received data:", stdout.length);
    console.info("stdout: ", stdout);
    if (rec.acceptWaveform(stdout))
        console.log("result: ", rec.result());
    else
        console.log("partial: ", rec.partialResult());
    console.log("final: ", rec.finalResult());
});

ffmpeg_run.stderr.on('error', error => 
    console.error("FFmpeg error: ", error));

ffmpeg_run.on('exit', code => {
    console.info("exit code: ", code);
});
