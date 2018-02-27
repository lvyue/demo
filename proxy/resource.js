const _ = require('lodash');
const es = require('../utils/es');
const models = require('../models');
const Resource = models.Resource;
// const Schema = models.Schema;
const debug = require('debug')('es');

const RP = {};


RP.insert = function (resource, cb) {
    if (_.isFunction(resource)) {
        cb = resource;
        resource = null;
    }
    if (!_.isFunction(cb)) {
        cb = _.noop;
    }
    if (!_.isObject(resource) || _.isEmpty(resource)) {
        return cb(new Error('Resource is not an  object type or empty!'));
    }
    let res = new Resource(resource); // 生成model
    res.create_time = new Date();
    res.update_time = res.create_time;
    res.save(err => {
        if (err)
            return cb(err);
        if (res.is_public === 1) { // 公开项目同步到资源
            es.create(res._id);
        }
        cb(null, res);
    });
};
RP.update = function (id, resource, cb) {
    if (_.isFunction(resource)) {
        cb = resource;
        resource = null;
    }
    if (!_.isFunction(cb)) {
        cb = _.noop;
    }
    if (!_.isObject(resource) || _.isEmpty(resource)) {
        return cb(new Error('Resource is not an  object type or empty!'));
    }
    debug(resource);
    Resource.findByIdAndUpdate({
        '_id': id
    }, {
        '$set': resource
    }, (err, res) => {
        if (err)
            return cb(err);
        if (resource.is_public === 2) {
            if (res.is_public === 1) { // 移除
                es.delete(id, debug);
            }
        } else {
            if (res.is_public === 2) { // 新增
                es.create(res._id, debug);
            } else { // 更新: 删除并重建
                es.delete(id, err => {
                    if (err)
                        return debug(err);
                    es.create(id, debug);
                });
            }
        }
        cb(null, res);
    });
};



RP.query = function (query, select, options, callback) {
    if (_.isFunction(query)) {
        callback = query;
        query = {
            status: {
                '$ne': -1
            }
        };
        select = {
            history: 0
        };
        options = {};
    }
    if (_.isFunction(select)) {
        callback = select;
        select = {
            history: 0
        };
        options = {};
    }
    if (_.isFunction(options)) {
        callback = options;
        options = {};
    }
    const cursor = Resource.find(query, select);
    if (options.populate) {
        cursor.populate(options.populate);
    }
    if (options.sort) {
        cursor.sort(options.sort);
    }
    if (options.skip) {
        cursor.skip(options.skip);
    }
    if (options.limit) {
        cursor.limit(options.limit);
    }
    cursor.exec(callback);
};

RP.findOne = function (query, select, options, callback) {
    if (_.isFunction(query)) {
        callback = query;
        query = {
            'status': {
                $ne: -1
            }
        };
        select = {
            history: 0
        };
        options = {};
    } else if (_.isString(query)) {
        query = {
            '_id': query,
            'status': {
                $ne: -1
            }
        };
    } else if (!_.isObject(query)) {
        query = {
            'status': {
                $ne: -1
            }
        };
    }
    if (_.isFunction(select)) {
        callback = select;
        select = {
            history: 0
        };
        options = {};
    } else if (!_.isObject(select)) {
        select = {
            history: 0
        };
    }
    if (_.isFunction(options)) {
        callback = options;
        options = {};
    } else if (!_.isObject(options)) {
        options = {};
    }

    if (!_.isFunction(callback)) {
        callback = _.noop;
    }
    const cursor = Resource.findOne(query, select);
    if (options.populate) {
        cursor.populate(options.populate);
    }
    cursor.exec(callback);
};

//
RP.count = function (query, callback) {
    if (_.isFunction(query)) {
        callback = query;
        query = {};
    }
    if (!_.isFunction(callback)) {
        callback = _.noop;
    }
    Resource.count(query, callback);
};

RP.offline = function (id, callback) {
    Resource.update({
        '_id': id,
        'is_public': 1
    }, {
        '$set': {
            'is_public': 2
        }
    }, (err, rs) => {
        if (err)
            return callback(err);
        debug(rs);
        if (rs.nModified >= 1) {
            es.delete(id, debug);
        }
        callback(null, rs);
    });
};

RP.online = function (id, callback) {
    Resource.update({
        '_id': id,
        'is_public': 2
    }, {
        '$set': {
            'is_public': 1
        }
    }, (err, rs) => {
        if (err)
            return callback(err);
        debug(rs);
        if (rs.nModified >= 1) {
            es.create(id, debug);
        }
        callback(null, rs);
    });
};

RP.download = function (id, callback) {
    Resource.findOneAndUpdate({
        '_id': id,
        'status': {
            '$ne': -1
        }
    }, {
        '$inc': {
            'download_num': 1
        }
    }, {
        new: true,
        fields: {
            id: 1,
            is_public: 1,
            download_num: 1
        }
    }, (err, res) => {
        if (err)
            return callback(err);
        debug(res);
        if (res.is_public === 1) {
            es.update(id, {
                download_num: res.download_num
            }, debug);
        }
        callback(null, res);
    });
};

RP.pageview = function (id, callback) {
    Resource.findOneAndUpdate({
        '_id': id,
        'status': {
            '$ne': -1
        }
    }, {
        '$inc': {
            'pageview_num': 1
        }
    }, {
        new: true,
        fields: {
            id: 1,
            is_public: 1,
            pageview_num: 1
        }
    }, (err, res) => {
        if (err)
            return callback(err);
        debug(res);
        if (res.is_public === 1) {
            es.update(id, {
                pageview_num: res.pageview_num
            }, debug);
        }
        callback(null, res);
    });
};


RP.delete = function (id, callback) {
    Resource.findOneAndUpdate({
        '_id': id,
        'status': {
            '$ne': -1
        }
    }, {
        '$set': {
            'status': -1
        }
    }, {
        new: true,
        fields: {
            id: 1,
            is_public: 1,
        }
    }, (err, res) => {
        if (err)
            return callback(err);
        debug(res);
        if (res && res.is_public === 1) {
            es.delete(id, debug);
        }
        callback(null, res);
    });
};

module.exports = RP;