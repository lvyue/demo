const express = require('express');
const router = express.Router();
const attachments = require('../data/attachments');
const JWT = require('jsonwebtoken');


/* GET home page. */
router.get('/', function (req, res) {
	res.render('index', {
		title: '文件下载',
		attachments
	});
});

router.get('/downloads/:_id', (req, res) => {
	const _id = req.params._id;
	const attachment = attachments.find(val => (val._id === _id));
	if (attachment) {
		const token = JWT.sign({
			name: attachment.name,
			path: attachment.path,
			ext: attachment.ext, // 
			size: attachment.size, // 大小
			expire: Math.random(Date.now() / 1000) + 300 // 过期时间，签名时间+ 5分钟
		}, 'secret');
		return res.redirect(`/download?t=${token}`);
	}
	return res.status(404).end();
});
module.exports = router;