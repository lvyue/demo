const url = require('url');
const cheerio = require('cheerio');
const http = require('http');
const _ = require('lodash');
const debug = require('debug')('es');
const async = require('async');
const ResourceProxy = require('../../proxy/resource');

const uas = ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
    'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; en-us) AppleWebKit/534.50 (KHTML, like Gecko) Version/5.1 Safari/534.50',
    'Mozilla/5.0 (Windows NT 6.1; rv,2.0.1) Gecko/20100101 Firefox/4.0.1'
];

const basic_uri = 'http://down.51cto.com/detail_list.php?c_it=4401&c_re=&t_j=&isfree=&sortby=d&type=1&jr=&page=';
async.eachLimit([1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], 1, (page, done) => {
    let options = url.parse(basic_uri + page);
    options.headers = {
        'User-Agent': uas[Math.floor(Math.random() * 3)]
    };
    debug('Options:', options);
    http.get(options, res => {
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {
            rawData += chunk;
        });
        res.on('end', () => {
            try {

                // debug(rawData);
                let $ = cheerio.load(rawData);
                let resources = [];
                $('.file').each((i, e) => {
                    let $file = cheerio(e);
                    let resource = {};
                    // 名称
                    resource.name = $file.find('> li:first-child > a:first-child').text().replace(/\n*\t*/g, '');
                    // 描述
                    resource.desc = $file.find('.lead').text().replace(/\n*\t*/g, '');
                    // 下载分值
                    resource.score = Math.ceil(Math.random() * 20);
                    // 标签处理
                    resource.labels = [];
                    $file.find('.label > .items > li').each((i, span) => {
                        resource.labels.push(cheerio(span).text().replace(/\n*\t*/g, ''));
                    });
                    // 得分
                    resource.grade = Math.random() * 5;
                    // 浏览量
                    resource.pageview_num = Math.round(10000 * Math.random());
                    // 下载量
                    resource.download_num = Math.round(10000 * Math.random() / 2);
                    resource.download_num = resource.pageview_num >= resource.download_num ? resource.download_num : Math.round(resource.pageview_num / 2);
                    // 是否发布
                    resource.is_public = Math.floor(Math.random() * 2 + 1);
                    // 类型
                    resource.category = Math.floor(Math.random() * 7 + 1);
                    debug(JSON.stringify(resource));
                    resources.push(resource);

                });
                async.each(resources, (item, done2) => {
                    // 保存数据
                    ResourceProxy.insert(item, done2);
                }, done);
            } catch (e) {
                done(e);
            }
        });
    }).on('error', err => {
        done(err);
    });
}, err => {
    if (err) {
        debug(err);
    }
    process.exit(0);
});