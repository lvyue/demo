const express = require('express');
const router = express.Router();

const path = require('path');
const UUID = require('uuid');
const debug = require('debug')('word');
const unoconv = require('lib-unoconv');

const destFolderPath = path.join(__dirname, '../upload');
const originPath = path.join(destFolderPath, 'origin'); // 原文件存储位置
const previewPath = path.join(destFolderPath, 'preview'); // 预览文件存储位置
var multer = require('multer');
var upload = multer({
    storage: multer.diskStorage({
        destination: originPath,
        filename: function (req, file, cb) {
            cb(null, file.originalname.replace(/.*(\.[a-zA-Z0-9]+)$/i, `${UUID.v1()}$1`));
        }
    })
});

router.get('/', (req, res) => {
    res.render('convert/upload', {
        title: 'Office文件转换'
    });
});

router.post('/upload', upload.single('word'), (req, res) => {
    const file = req.file;
    const format = req.body.format || '1';
    res.redirect(`/convert/${file.filename}?f=${format}`);
});

router.get('/:source', (req, res) => {
    const source = req.params.source;
    const format = req.query.f || '1';
    const srcFilePath = path.join(originPath, source);
    const destFilePath = path.join(previewPath, source, `index.${format == '1' ? 'html' : 'pdf'}`);
    debug('srcFilePath:', srcFilePath);
    debug('destFilePath:', destFilePath);
    unoconv.convert(
        srcFilePath,
        format == '1' ? 'html' : 'pdf',
        {
            out: destFilePath
        },
        err => {
            debug(err);
            return res.render('convert/html', {
                title: 'Office转换',
                path: source,
                format: format
            });
        }
    );
});

module.exports = router;
