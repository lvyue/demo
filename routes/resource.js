const router = require('express').Router();

const debug = require('debug')('es');
const ResourceProxy = require('../proxy/resource');

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