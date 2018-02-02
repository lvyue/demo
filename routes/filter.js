const express = require('express');
const router = express.Router();
const xlsx = require('node-xlsx');
const _ = require('lodash');
const path = require('path');
const debug = require('debug')('filter');
let sheet = xlsx.parse(path.join(__dirname, '../data/keywords.xls'));
const tire = {};
if (sheet && sheet.length > 0) {
    let data = sheet[0].data,
        characters, p, m, code;
    if (Array.isArray(data)) {
        data.splice(0, 1);
        data.forEach(row => {
            p = tire;
            characters = row[0].split(''); // 拆分对象
            characters.forEach((char, index) => {
                code = char.charCodeAt();
                m = p[code];
                if (!m) {
                    m = {};
                    p[code] = m;
                }
                if (index === characters.length - 1) { // stop
                    m.r = row[1]; // 设置组织格式
                } else {
                    p = m;
                }
            });
        });
    }
}
debug('Tire Size:', (JSON.stringify(tire).length / 1024 / 1024).toFixed(4), '(MB)');


/* GET users listing. */
router.get('/', function (req, res) {
    return res.render('filter', {
        title: '内容过滤',
    });
});

router.post('/', function (req, res) {
    let content = _.trim((req.body.content || '').toString().replace(/[^\u4e00-\u9fa5a-z0-9]+/gi, ''));
    let rule = '';
    if (content) { // 过滤
        let characters = content.split('');
        let cache = {};
        for (let prop of characters) {
            let code = prop.charCodeAt();
            let keys = Object.keys(cache);
            for (let key of keys) {
                let tmp = cache[key];
                let r = tmp[code];
                if (r) {
                    if (r.r) {
                        rule = r.r;
                        break;
                    }
                    cache[key] = r;
                } else {
                    delete cache[key];
                }
            }
            if (rule) {
                break;
            }
            let m = tire[code];
            if (m) {
                cache[code + Math.random().toString(16)] = m;
            }
        }
    }
    return res.json({
        'code': 0,
        'msg': rule
    });
});

module.exports = router;