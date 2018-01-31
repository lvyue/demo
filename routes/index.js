const express = require('express');
const router = express.Router();
const attachments = require('../data/attachments');
const JWT = require('jsonwebtoken');


const ADMZip = require('adm-zip');
const path = require('path');
const XML = require('xml-js');
const _ = require('lodash');
const fs = require('fs');
const UUID = require('uuid');
const wmf = require('libwmf');
const debug = require('debug')('word');
const unoconv = require('lib-unoconv');


const destFolderPath = path.join(__dirname, '../upload');
const originPath = path.join(destFolderPath, 'origin'); // 原文件存储位置
const previewPath = path.join(destFolderPath, 'preview'); // 预览文件存储位置
var multer = require('multer');
var upload = multer({
	storage: multer.diskStorage({
		destination: originPath,
		filename: function (req, file, cb) {
			cb(null, file.originalname.replace(/.*(\.[a-zA-Z0-9]+)$/i, `${UUID.v1()}$1`));
		}
	})
});
const question_categories = {
	1: '单选题',
	2: '多选题',
	3: '判断题',
	4: '填空题',
	5: '简答题'
};
const question_categories_rev = {
	'单选题': 1,
	'多选题': 2,
	'判断题': 3,
	'填空题': 4,
	'简答题': 5,
};


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

router.get('/convert/:file', (req, res) => {
	const file = req.params.file;
	if (!file) {
		return res.render('convert', {
			title: 'word解析',
			questions: [],
			question_categories
		});
	}
	const filePath = path.join(originPath, file); // 生成路径
	const word = new ADMZip(filePath);
	const contentXml = word.readAsText('word/document.xml'); //将document.xml读取为text内容；
	const relXml = word.readAsText('word/_rels/document.xml.rels'); //将document.xml读取为text内容；
	const contentJson = XML.xml2js(contentXml, {
		compact: true,
		spaces: 4
	});
	const relsJson = XML.xml2js(relXml, {
		compact: true,
	});
	const rels = {};
	if (relsJson && relsJson.Relationships && relsJson.Relationships.Relationship) {
		relsJson.Relationships.Relationship.forEach(rel => {
			rels[rel._attributes.Id] = rel._attributes.Target;
		});
	}
	const body = contentJson['w:document']['w:body']['w:p'];
	const questions = [];
	let blankLineNum = 3; // 空行计数
	let question;
	body.forEach(line => {
		if (!line['w:r']) { // 空行
			if (blankLineNum === 3) {
				blankLineNum = 1;
			} else {
				blankLineNum++;
			}
		} else {
			if (blankLineNum === 3) { // 题干
				question = {
					content: '',
					category: -1, // 1 单选题 2.多选题  3.判断题 4.填空题 5.简答题 -1.默认值 
					score: 0,
					options: [],
					answer: [],
				}; //  创建新试题
				let _htmls = [];
				const wrs = line['w:r'];
				wrs.forEach(wr => {
					if (wr['w:t']) { // 文本内容
						_htmls.push(wr['w:t']._text);
					} else if (wr['w:drawing']) {
						// TODO 处理图片
						const draw = JSON.stringify(wr['w:drawing']);
						const relId = draw.replace(/.*(rId\d+).*/i, '$1'); // 获取资源ID
						if (relId && rels[relId]) { // 资源判断
							const sourcePath = rels[relId];
							const destFileName = sourcePath.replace(/.*(\.[a-zA-Z0-9]+)$/, `${UUID.v1()}$1`);
							const destFilePath = path.join(previewPath, destFileName);
							_htmls.push(`<img src="/upload/preview/${destFileName}">`);
							fs.writeFile(destFilePath, word.readFile(path.join('word', sourcePath))); // 提取资源
						}
					} else if (wr['w:object']) {
						// TODO 处理图片
						const draw = wr['w:object'];
						if (draw['v:shape'] && draw['v:shape']['v:imagedata']) {
							let style = draw['v:shape']['_attributes']['style']; // 获取外层央视
							if (style) { // 处理样式
								style = style.split(';').map(r => {
									if (r.endsWith('pt')) {
										r = r.slice(0, -2);
										r = r.split(':');
										r[1] = (Number(r[1]) / 3 * 4).toFixed(2) + 'px';
										return r.join(':');
									} else {
										return r;
									}
								}).join(';');
							}
							const relId = draw['v:shape']['v:imagedata']['_attributes']['r:id']; // 获取资源ID
							if (relId && rels[relId]) { // 资源判断
								const sourcePath = rels[relId];
								if (sourcePath.toLowerCase().endsWith('.wmf')) {
									const nameUUID = UUID.v1();
									const destFileName = `${nameUUID}.png`;
									const tmpFilePath = path.join(previewPath, sourcePath.replace(/.*(\.[a-zA-Z0-9]+)$/, `${nameUUID}$1`));
									const destFilePath = path.join(previewPath, destFileName);
									_htmls.push(`<img src="/upload/preview/${destFileName}" style="${style}" >`);
									fs.writeFile(tmpFilePath, word.readFile(path.join('word', sourcePath)), err => {
										if (err) {
											debug(err);
											return;
										}
										wmf(tmpFilePath).max().toPNG(destFilePath, err => {
											if (err) {
												debug(err);
												return;
											}
										});
									}); // 提取资源
								}
							}
						}
					}
				});
				let arrs = _htmls.join('').split('[');
				if (arrs.length >= 2) {
					let scoreStr = _.trim(arrs.pop());
					if (scoreStr) {
						scoreStr = scoreStr.slice(0, -2);
						question.score = Number(scoreStr);
					}
					let typeStr = _.trim(arrs.pop());
					if (typeStr) { // 题型
						if (typeStr.endsWith(']')) {
							question.category = question_categories_rev[typeStr.slice(0, -1)] || -1;
						} else {
							arrs.push(typeStr);
						}
					}
				}
				let content = _.trim(arrs.join('['));
				if (question.category === -1) { // 未设置题型
					if (content.endsWith('（错）')) {
						question.category = 3;
						question.answer.push('错');
					} else if (content.endsWith('（对）')) {
						question.category = 3;
						question.answer.push('对');
					}
					content = content.slice(0, -3);
				}
				// 处理题干
				if (question.category === 1 || question.category === 2) { // 处理选择题
					let reg = /（\s[a-zA-Z]+\s）/g;
					content.match(reg).forEach(m => {
						question.answer.push(...(m.slice(2, -2).split('')));
					});
					content = content.replace(reg, '（  ）');
				} else if (question.category === 4) { // 填空题
					let reg = /\{[^}^{]+\}/g;
					content.match(reg).forEach(m => {
						question.answer.push(m.slice(1, -1));
					});
					content = content.replace(reg, '_________');
				}
				question.content = content;

				questions.push(question);
				blankLineNum = 0;
			} else { // 选项OR 其他
				const wrs = line['w:r'];
				let _htmls = [];
				wrs.forEach(wr => {
					if (wr['w:t']) { // 文本内容
						_htmls.push(wr['w:t']._text);
					} else if (wr['w:drawing']) {
						// TODO 处理图片
						const draw = JSON.stringify(wr['w:drawing']);
						const relId = draw.replace(/.*(rId\d+).*/i, '$1'); // 获取资源ID
						if (relId && rels[relId]) { // 资源判断
							const sourcePath = rels[relId];
							const destFileName = sourcePath.replace(/.*(\.[a-zA-Z0-9]+)$/, `${UUID.v1()}$1`);
							const destFilePath = path.join(previewPath, destFileName);
							_htmls.push(`<img src="/upload/preview/${destFileName}">`);
							fs.writeFile(destFilePath, word.readFile(path.join('word', sourcePath))); // 提取资源
						}
					} else if (wr['w:object']) {
						// TODO 处理图片
						const draw = wr['w:object'];
						if (draw['v:shape'] && draw['v:shape']['v:imagedata']) {
							let style = draw['v:shape']['_attributes']['style']; // 获取外层央视
							if (style) { // 处理样式
								style = style.split(';').map(r => {
									if (r.endsWith('pt')) {
										r = r.slice(0, -2);
										r = r.split(':');
										r[1] = (Number(r[1]) / 3 * 4).toFixed(2) + 'px';
										return r.join(':');
									} else {
										return r;
									}
								}).join(';');
							}
							const relId = draw['v:shape']['v:imagedata']['_attributes']['r:id']; // 获取资源ID
							if (relId && rels[relId]) { // 资源判断
								const sourcePath = rels[relId];
								if (sourcePath.toLowerCase().endsWith('.wmf')) {
									const nameUUID = UUID.v1();
									const destFileName = `${nameUUID}.png`;
									const tmpFilePath = path.join(previewPath, sourcePath.replace(/.*(\.[a-zA-Z0-9]+)$/, `${nameUUID}$1`));
									const destFilePath = path.join(previewPath, destFileName);
									_htmls.push(`<img src="/upload/preview/${destFileName}" style="${style}" >`);
									fs.writeFile(tmpFilePath, word.readFile(path.join('word', sourcePath)), err => {
										if (err) {
											debug(err);
											return;
										}
										wmf(tmpFilePath).max().toPNG(destFilePath, err => {
											if (err) {
												debug(err);
												return;
											}
										});
									}); // 提取资源
								}
							}
						}
					}
				});
				question.options.push(_htmls.join(''));
			}
		}
	});
	setTimeout(() => {
		res.render('convert', {
			title: 'word解析',
			questions,
			question_categories: {
				1: '单选题',
				2: '多选题',
				3: '判断题',
				4: '填空题',
				5: '简答题'
			}
		});
	}, 300);

});

router.get('/upload', (req, res) => {
	res.render('upload', {
		title: '文件上传'
	});
});

router.post('/upload', upload.single('word'), (req, res) => {
	const file = req.file;
	const type = req.body.type || '1';
	const format = req.body.format || '1';
	res.redirect(`/${type == 1 ? 'convert':'html'}/${file.filename}?f=${format}`);
});

router.get('/html/:source', (req, res) => {
	const source = req.params.source;
	const format = req.query.f || '1';
	const srcFilePath = path.join(originPath, source);
	const destFilePath = path.join(previewPath, source, `index.${format == '1'?'html':'pdf'}`);
	debug('srcFilePath:', srcFilePath);
	debug('destFilePath:', destFilePath);
	unoconv.convert(srcFilePath, format == '1' ? 'html' : 'pdf', {
		out: destFilePath
	}, (err) => {
		debug(err);
		return res.render('html', {
			title: 'Office To Html',
			path: source,
			format: format
		});
	});

});




module.exports = router;