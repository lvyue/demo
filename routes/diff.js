const express = require('express');
const router = express.Router();
const path = require('path');
const UUID = require('uuid');
const AttachProxy = require('../proxy/attach');

const destFolderPath = path.join(__dirname, '../upload');
const originPath = path.join(destFolderPath, 'origin'); // 原文件存储位置
var multer = require('multer');
var upload = multer({
    storage: multer.diskStorage({
        destination: originPath,
        filename: function (req, file, cb) {
            cb(null, file.originalname.replace(/.*(\.[a-zA-Z0-9]+)$/i, `${UUID.v1()}$1`));
        }
    })
});

router.get('/', (req, res, next) => {
    AttachProxy.query({ status: 1 }, { _id: 1, name: 1 }, (err, attaches) => {
        if (err) return next(err);
        res.render('diff/upload', {
            title: '文档内容率重',
            attaches: attaches
        });
    });
});

router.post('/upload', upload.single('word'), (req, res, next) => {
    const file = req.file;
    AttachProxy.insert(
        {
            name: file.originalname,
            mime: file.mimetype,
            length: file.size,
            path: file.filename
        },
        (err, attach) => {
            if (err) return next(err);
            res.redirect(`/diff/${attach._id}`);
        }
    );
});

router.get('/:id', (req, res, next) => {
    AttachProxy.findOne({ _id: req.params.id }, { contents: 0 }, { populate: { path: 'rates.file', select: '_id name' } }, (err, attach) => {
        if (err) return next(err);
        res.render('diff/show', {
            title: '文档内容率重',
            attach: attach
        });
    });
});

module.exports = router;
