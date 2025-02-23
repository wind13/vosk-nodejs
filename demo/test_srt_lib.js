const fs = require('fs');

// 示例 JSON 数组
const jsonArray = [
    {
        index: 1,
        start: 0.5,
        end: 2.5,
        text: "Hello, world!"
    },
    {
        index: 2,
        start: 3.0,
        end: 5.0,
        text: "This is a test."
    }
];

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
        return `${item.index}\n` +
               `${formatTime(item.start)} --> ${formatTime(item.end)}\n` +
               `${item.text}\n`;
    }).join('\n');
}

// 生成 SRT 字符串
const srtContent = jsonToSrt(jsonArray);

// 写入文件
fs.writeFileSync('output.srt', srtContent);

console.log('SRT file generated: output.srt');