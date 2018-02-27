const router = require('express').Router();
const debug = require('debug')('es');
const eventproxy = require('eventproxy');
const _ = require('lodash');

const ResourceProxy = require('../proxy/resource');

const es = require('../utils/es');

// 资源列表
router.get('/', (req, res) => {
    // let page = Number(req.query.page || '1');
    // page = Math.ceil(isNaN(page) ? 1 : page < 1 ? 1 : page);
    // let query = {
    //     status: {
    //         '$ne': -1
    //     }
    // };
    // const proxy = eventproxy.create(['count', 'resources'], function (count, resources) {
    //     debug(JSON.stringify(resources));
    //     debug(JSON.stringify(count));
    res.render('resource/list', {
        title: '资源列表',
        categories: {
            1: '课件',
            2: '视频',
            3: '教案',
            4: '试卷',
            5: '作业',
            6: '试题',
            7: '代码'
        }
    });
    // });
    // ResourceProxy.count(query, proxy.done('count'));
    // ResourceProxy.query(query, {
    //     desc: 0
    // }, {
    //     skip: (page - 1) * 10,
    //     limit: 10
    // }, proxy.done('resources'));

});

// 资源搜索页面
router.get('/search', (req, res) => {
    res.render('resource/search', {
        title: '资源搜索',
    });
});

// 资源搜索接口
router.get('/_search', (req, res) => {
    let query = req.query.q || ''; // 查询条件
    let category = Number(req.query.category || '0'); //  类型
    category = isNaN(category) ? 0 : category < 1 ? 0 : Math.floor(category);
    let page = Number(req.query.page || '1'); // 分页
    page = isNaN(page) ? 1 : page < 1 ? 1 : Math.floor(page);
    let label = req.query.t || ''; // 标签
    let body = {
        query: {},
        'highlight': {
            'fields': {
                '*': {}
            }
        },
        from: (page - 1) * 10,
        size: 10
    };
    let filters = [];
    if (category > 0) { // 设置过滤器
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
                body.query.bool.must = [{
                    'multi_match': {
                        'query': query,
                        'fields': ['name', 'desc', 'labels']
                    }
                }];
            }
        } else {
            body.query = {
                'multi_match': {
                    'query': query,
                    'fields': ['name', 'desc', 'labels']
                }
            };
        }
    }
    debug('Query:', JSON.stringify(body));
    es.client.search({
        index: 'demo',
        type: 'resource',
        body: body
    }, (err, rs) => {
        res.json({
            'code': 0,
            msg: 'ok',
            data: rs.hits
        });
    });
});

// 发布资源
router.post('/', (req, res) => {
    let resource = req.body;
    ResourceProxy.insert(resource, (err) => {
        let code = 0;
        if (err) {
            code = 99999;
            debug(err);
        }
        res.json({
            'code': code,
            'msg': 'ok'
        });
    });

});

module.exports = router;