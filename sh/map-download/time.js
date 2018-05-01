const FS = require('fs');
const Async = require('async');
const Path = require('path');
const baseDir = '/Users/lvyue/Pictures/map';
let i = 60 * 821 * 5;
FS.readdir(baseDir, (err, files) => {
    if (err) return console.error(err), process.exit();
    Async.eachLimit(
        files,
        1,
        (file, done) => {
            let sub = i;
            i -= 60 * 5;
            FS.utimes(Path.join(baseDir, file), Math.ceil(Date.now() / 1000) - sub, Math.ceil(Date.now() / 1000) - sub, done);
        },
        err => {
            if (err) return console.error(err), process.exit(-1);
            process.exit();
        }
    );
});
