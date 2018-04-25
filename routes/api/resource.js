const router = require('express').Router();
const debug = require('debug')('es');
const eventproxy = require('eventproxy');
const _ = require('lodash');

const ResourceProxy = require('../../proxy/resource');

const es = require('../../utils/es');

// 资源列表
router.get('/', (req, res) => {
    let page = Number(req.query.page || '1');
    page = Math.ceil(isNaN(page) ? 1 : page < 1 ? 1 : page);
    let query = {
        status: {
            $ne: -1
        }
    };
    const proxy = eventproxy.create(['count', 'resources'], function(count, resources) {
        res.json({
            code: 0,
            msg: 'ok',
            data: {
                count: count,
                page: page,
                resources: resources || []
            }
        });
    });
    proxy.fail(err => {
        debug(err);
        res.json({
            code: 9999999,
            msg: 'Error'
        });
    });
    ResourceProxy.count(query, proxy.done('count'));
    ResourceProxy.query(
        query,
        {},
        {
            skip: (page - 1) * 10,
            limit: 10
        },
        proxy.done('resources')
    );
});

// 资源搜索接口
router.get('/search', (req, res) => {
    let query = req.query.q || ''; // 查询条件
    let category = Number(req.query.category || '0'); //  类型
    category = isNaN(category) ? 0 : category < 1 ? 0 : Math.floor(category);
    let page = Number(req.query.page || '1'); // 分页
    page = isNaN(page) ? 1 : page < 1 ? 1 : Math.floor(page);
    let label = req.query.t || ''; // 标签
    let body = {
        query: {},
        highlight: {
            fields: {
                '*': {}
            }
        },
        from: (page - 1) * 10,
        size: 10
    };
    let filters = [];
    if (category > 0) {
        // 设置过滤器
        filters.push({
            term: {
                category
            }
        });
    }
    if (!_.isEmpty(label)) {
        filters.push({
            term: {
                labels: label
            }
        });
    }
    if (_.isEmpty(query) && filters.length === 0) {
        body.query = {
            match_all: {}
        };
    } else {
        if (filters.length != 0) {
            body.query = {
                bool: {
                    filter: filters
                }
            };
            if (!_.isEmpty(query)) {
                body.query.bool.must = [
                    {
                        multi_match: {
                            query: query,
                            fields: ['name', 'desc', '_labels']
                        }
                    }
                ];
            }
        } else {
            body.query = {
                multi_match: {
                    query: query,
                    fields: ['name', 'desc', '_labels']
                }
            };
        }
    }
    debug('Query:', JSON.stringify(body));
    es.client.search(
        {
            index: 'demo',
            type: 'resource',
            body: body
        },
        (err, rs) => {
            res.json({
                code: 0,
                msg: 'ok',
                data: rs.hits
            });
        }
    );
});

// 添加资源
router.post('/', (req, res) => {
    let resource = req.body;
    ResourceProxy.insert(resource, err => {
        let code = 0;
        if (err) {
            code = 99999;
            debug(err);
        }
        res.json({
            code: code,
            msg: 'ok'
        });
    });
});

// 修改资源
router.put('/:_id', (req, res) => {
    let resource = req.body;
    ResourceProxy.update(req.params._id, resource, err => {
        let code = 0;
        if (err) {
            code = 99999;
            debug(err);
        }
        res.json({
            code: code,
            msg: 'ok'
        });
    });
});

// 添加资源
router.put('/:_id/online', (req, res) => {
    ResourceProxy.online(req.params._id, err => {
        let code = 0;
        if (err) {
            code = 99999;
            debug(err);
        }
        res.json({
            code: code,
            msg: 'ok'
        });
    });
});

// 添加资源
router.put('/:_id/offline', (req, res) => {
    ResourceProxy.offline(req.params._id, err => {
        let code = 0;
        if (err) {
            code = 99999;
            debug(err);
        }
        res.json({
            code: code,
            msg: 'ok'
        });
    });
});
// 添加资源
router.get('/:_id/download', (req, res) => {
    ResourceProxy.download(req.params._id, (err, rs) => {
        let code = 0;
        if (err) {
            code = 99999;
            debug(err);
        }
        res.json({
            code: code,
            msg: 'ok',
            data: rs
        });
    });
});

// 添加资源
router.get('/:_id/pageview', (req, res) => {
    ResourceProxy.pageview(req.params._id, (err, rs) => {
        let code = 0;
        if (err) {
            code = 99999;
            debug(err);
        }
        res.json({
            code: code,
            msg: 'ok',
            data: rs
        });
    });
});

// 添加资源
router.delete('/:_id', (req, res) => {
    ResourceProxy.delete(req.params._id, err => {
        let code = 0;
        if (err) {
            code = 99999;
            debug(err);
        }
        res.json({
            code: code,
            msg: 'ok'
        });
    });
});

module.exports = router;
