const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const async = require('async');
const eventproxy = require('eventproxy');
const ADMZip = require('adm-zip');
const cheerio = require('cheerio');
const _ = require('lodash');

let files = [
    {
        _id: '1',
        path: 'demo1.docx',
        hash: '',
        content: '',
        contents: [],
        main: true,
        rates: []
    },
    {
        _id: '2',
        path: 'demo2.docx',
        hash: '',
        content: '',
        contents: [],
        rates: []
    },
    {
        _id: '3',
        path: 'demo3.docx',
        hash: '',
        content: '',
        contents: [],
        rates: []
    }
];
/**
 *  对比文件信息
 * @param {*} source
 * @param {*} target
 * @param {*} callback
 */
var diff = function (source, target, callback) {
    if (source.stat && target.stat) {
        // 判断字节数是否相同
        if (source.stat.size === target.stat.size) {
            if (source.hash === target.hash) {
                source.rates.push({
                    file: target._id,
                    rate: 1,
                    source: `<em>${source.content}</em>`,
                    target: `<em>${target.content}</em>`
                });
                target.rates.push({
                    file: source._id,
                    rate: 1,
                    source: `<em>${target.content}</em>`,
                    target: `<em>${source.content}</em>`
                });
                return callback(undefined, target);
            }
        }
        if (source.content === target.content) {
            source.rates.push({
                file: target._id,
                rate: 1,
                source: `<em>${source.content}</em>`,
                target: `<em>${target.content}</em>`
            });
            target.rates.push({
                file: source._id,
                rate: 1,
                source: `<em>${target.content}</em>`,
                target: `<em>${source.content}</em>`
            });
            return callback(undefined, target);
        }
        // 重复计数
        let repeatCount = 0;
        // 目标文本
        let targetContents = [];
        // 源文本
        let sourceContents = [];
        // 目标缓存
        let sourceCache = source.contents.reduce((pre, val, index) => {
            pre[val] = index;
            sourceContents.push(val);
            return pre;
        }, {});
        // 目标筛选
        target.contents.forEach(c => {
            let index = sourceCache[c];
            // 有数据
            if (index >= 0) {
                repeatCount++;
                sourceContents[index] = `<em>${c}</em>`;
                targetContents.push(`<em>${c}</em>`);
            } else {
                targetContents.push(c);
            }
        });
        source.rates.push({
            file: target._id,
            rate: repeatCount / source.contents.length,
            source: sourceContents.join(''),
            target: targetContents.join('')
        });
        target.rates.push({
            file: source._id,
            rate: repeatCount / target.contents.length,
            source: targetContents.join(''),
            target: sourceContents.join('')
        });
        return callback(undefined, target);
        // 处理内容
    } else {
        source.rates.push({
            file: target._id,
            rate: 0,
            source: source.content,
            target: target.content
        });
        target.rates.push({
            file: source._id,
            rate: 0,
            source: target.content,
            target: source.content
        });
        callback(undefined, target);
    }
};

async.mapLimit(
    files,
    5,
    (file, done) => {
        // 本地路径
        if (!file.localPath) file.localPath = path.join(__dirname, `./doc/${file.path}`);
        const proxy = eventproxy.create(['stat', 'hash', 'contents'], (stat, hash, contents) => {
            file.stat = stat;
            file.hash = hash;
            file.contents = contents;
            done(undefined, file);
        });
        if (!file.stat) {
            // 获取文件信息
            fs.stat(file.localPath, (err, stat) => {
                proxy.emit('stat', stat);
            });
        } else {
            proxy.emit('stat', file.stat);
        }
        if (!file.hash) {
            // 获取文件信息
            fs.readFile(file.localPath, (err, buf) => {
                if (err) {
                    console.error(err);
                    return proxy.emit('hash', '');
                }
                const md5 = crypto.createHash('md5');
                md5.update(buf);
                return proxy.emit('hash', md5.digest('hex'));
            });
        } else {
            proxy.emit('hash', file.hash);
        }

        if (!file.contents || file.contents.length === 0) {
            // 获取文件信息
            const word = new ADMZip(file.localPath);
            file.content = cheerio.load(word.readAsText('word/document.xml')).text();
            proxy.emit('contents', _.compact(file.content.replace(/([,.!?，。？；;])/gi, '$1$@=@$').split('$@=@$')));
        } else {
            proxy.emit('contents', file.contents);
        }
    },
    (err, stats) => {
        let main = stats.shift();
        async.mapLimit(
            stats,
            5,
            (file, done) => {
                diff(main, file, done);
            },
            (err, files) => {
                console.info('Main:', JSON.stringify(main));
                console.log('files:', JSON.stringify(files));
            }
        );
    }
);
