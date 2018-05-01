const FS = require('fs');
const Async = require('async');
const Path = require('path');
const baseDir = '/Users/lvyue/Pictures/map';
FS.readdir(baseDir, (err, files) => {
    if (err) return console.error(err), process.exit();
    Async.eachLimit(
        files,
        10,
        (file, done) => {
            if (file.length === 8) {
                FS.rename(Path.join(baseDir, file), Path.join(baseDir, 'm-' + file), done);
            } else {
                done(undefined);
            }
        },
        err => {
            if (err) return console.error(err), process.exit(-1);
            process.exit();
        }
    );
});
