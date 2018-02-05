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

router.get('*', (req, res) => {
    res.redirect(`/rule/${req.path}`);
});

module.exports = router;