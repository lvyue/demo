const mongoose = require('mongoose');
const debug = require('debug')('es');

const config = require('../config');

mongoose.Promise = require('bluebird');
debug('URI:', config.dbURI, ' options:', config.database.opts);
let conn = mongoose.createConnection(config.dbURI, config.database.opts || {});
conn.on('error', function (err) {
    if (err) {
        debug('链接到mongodb异常', err);
    } else {
        debug('已连接到mongodb');
    }
});

module.exports = conn;