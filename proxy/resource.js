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



module.exports = RP;