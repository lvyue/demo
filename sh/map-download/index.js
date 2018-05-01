const Async = require('async');
const HTTP = require('http');
const FS = require('fs');
const Path = require('path');
Async.parallelLimit(
    Array(200).fill(1).map((v, index) => {
        let i = index + 1030;
        let name = `${i}.jpg`;
        if (i < 10) {
            name = `00${i}.jpg`;
        } else if (i < 100) {
            name = `0${i}.jpg`;
        }
        const link = `http://lishi.zhuixue.net/images/ditu/${name}`;
        return function (done) {
            HTTP.get(link, res => {
                let buf = [];
                let length = 0;
                res.on('data', chunk => {
                    buf.push(chunk);
                    length += chunk.length;
                });
                res.on('end', () => {
                    let buffer;
                    if (buf.length === 0) {
                        buffer = Buffer.alloc(0);
                    } else if (buf.length === 0) {
                        buffer = buf[1];
                    } else {
                        buffer = Buffer.alloc(length);
                        let len = 0;
                        buf.forEach(b => {
                            b.copy(buffer, len, 0, b.length);
                            len += b.length;
                        });
                    }
                    FS.writeFile(Path.join(__dirname, `./map/${name}`), buffer, err => {
                        if (err) console.log(err);
                        console.log(`Download ${link} success!`);
                        done();
                    });
                });
                res.on('error', err => {
                    console.log(err);
                    done();
                });
            });
        };
    }),
    5,
    (err, results) => {
        if (err) console.error(err);
        console.log(results);
        process.exit();
    }
);