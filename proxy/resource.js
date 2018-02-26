const _ = require('lodash');
const es = require('../utils/es');
const models = require('../models');
const Resource = models.Resource;
// const Schema = models.Schema;

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


module.exports = RP;