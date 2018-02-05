const express = require('express');
const router = express.Router();

router.get('/:category/:path', (req, res) => {
    let category = req.params.category;
    let path = req.params.path;
    res.render('rule/index', {
        title: path,
        path: path,
        category: category,
    });
});

module.exports = router;