const elasticsearch = require('elasticsearch');
const _ = require('lodash');
const moment = require('moment');
const debug = require('debug')('es');
const config = require('../config');
const models = require('../models');

const Resource = models.Resource; // 资源

const client = new elasticsearch.Client({
    host: config.es.host
});

/**
 *  添加资源
 * @param {*} id 
 * @param {*} callback 
 */
exports.create = function (id, cb) {
    debug('Resource id:', id);
    if (!_.isFunction(cb))
        cb = _.noop;
    Resource.findOne({
        '_id': id,
        'is_public': 1, // 公开
        'status': { // 未删除
            '$ne': -1
        }
    }, (err, resource) => {
        if (err)
            return cb(err);
        if (!resource)
            return cb(new Error(`Resource [${id}] is not found`));
        // 转换为JSON
        resource = resource.toJSON();
        // 创建索引
        client.create({
            index: config.es.index,
            type: config.es.type,
            id: resource._id.toString(),
            body: {
                name: resource.name,
                desc: resource.desc,
                category: resource.category,
                classify: resource.classify,
                labels: resource.labels,
                score: resource.score,
                pageview_num: resource.pageview_num,
                download_num: resource.download_num,
                create_time: moment(resource.create_time).format('YYYY-MM-DD HH:mm:ss'),
                create_time_unix: new Date(resource.create_time).getTime(),
                update_time: moment(resource.update_time).format('YYYY-MM-DD HH:mm:ss'),
                update_time_unix: new Date(resource.update_time).getTime()
            }
        }, (err, res) => {
            if (err)
                return debug(err), cb(err);
            debug(res);
            cb(null, res);
        });
        debug({
            index: config.es.index,
            type: config.es.type,
            id: resource._id.toString(),
            body: {
                name: resource.name,
                desc: resource.desc,
                category: resource.category,
                classify: resource.classify,
                labels: resource.labels,
                score: resource.score,
                pageview_num: resource.pageview_num,
                download_num: resource.download_num,
                create_time: moment(resource.create_time).format('YYYY-MM-DD HH:mm:ss'),
                create_time_unix: new Date(resource.create_time).getTime(),
                update_time: moment(resource.update_time).format('YYYY-MM-DD HH:mm:ss'),
                update_time_unix: new Date(resource.update_time).getTime()
            }
        });
    });
};