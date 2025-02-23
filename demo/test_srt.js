const vosk = require('vosk');
const fs = require("fs");
const { spawn } = require("child_process");
// const { stringifySync } = require('srt');

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

if (process.argv.length > 2)
    FILE_NAME = process.argv[2]

vosk.setLogLevel(-1);
rec.setWords(true);

WORDS_PER_LINE = 7
const subs = []
const results = []
console.info("start: ", subs);

ffmpeg_run.stderr.on('error', error => console.error("FFmpeg error: ", error));
// .stdout
ffmpeg_run.stdout.on('data', (stdout) => {
    console.info("stdout: ", stdout);
    if (rec.acceptWaveform(stdout))
        results.push(rec.result());
    results.push(rec.finalResult());
});

// 将时间戳格式化为 SRT 格式
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(millis, 3)}`;
}

// 补零函数
function pad(num, size = 2) {
    let s = num.toString();
    while (s.length < size) s = '0' + s;
    return s;
}

// 将 JSON 数组转换为 SRT 字符串
function jsonToSrt(jsonArray) {
    return jsonArray.map(item => {
        return `${item.type}\n` +
            `${formatTime(item.data.start)} --> ${formatTime(item.data.end)}\n` +
            `${item.data.text}\n`;
    }).join('\n');
}

ffmpeg_run.on('exit', code => {
    console.info("code: ", code);
    rec.free();
    model.free();
    console.info("results: ", results);
    results.forEach(element => {
        console.info("element: ", element);
        if (!element.hasOwnProperty('result'))
            return;
        const words = element.result;
        if (words.length == 1) {
            subs.push({
                type: 'cue',
                data: {
                    start: words[0].start * 1000,
                    end: words[0].end * 1000,
                    text: words[0].word
                }
            });
            return;
        }
        var start_index = 0;
        var text = words[0].word + " ";
        for (let i = 1; i < words.length; i++) {
            text += words[i].word + " ";
            if (i % WORDS_PER_LINE == 0) {
                subs.push({
                    type: 'cue',
                    data: {
                        start: words[start_index].start * 1000,
                        end: words[i].end * 1000,
                        text: text.slice(0, text.length - 1)
                    }
                });
                start_index = i;
                text = "";
            }
        }
        if (start_index != words.length - 1)
            subs.push({
                type: 'cue',
                data: {
                    start: words[start_index].start * 1000,
                    end: words[words.length - 1].end * 1000,
                    text: text
                }
            });
    });
    console.log(JSON.stringify(subs, null, 2));
    // 生成 SRT 字符串
    const srtContent = jsonToSrt(subs);
    // console.log(stringifySync(subs, { format: "SRT" }));
    fs.writeFileSync('output.srt', srtContent);
});
