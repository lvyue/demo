const router = require('express').Router();

router.use('/resources', require('./resource'));
module.exports = router;