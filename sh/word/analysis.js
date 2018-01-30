const ADMZip = require('adm-zip');
const path = require('path');
const XML = require('xml-js');
const _ = require('lodash');
const fs = require('fs');
const UUID = require('uuid');
const spawn = require('child_process').spawn;
const gm = require('gm');

const destFolderPath = __dirname;
const filePath = path.join(destFolderPath, 'wordtestpaper.docx');
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
						const destFilePath = path.join(destFolderPath, destFileName);
						_htmls.push(`<img src="${destFileName}">`);
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
								const tmpFilePath = path.join(destFolderPath, sourcePath.replace(/.*(\.[a-zA-Z0-9]+)$/, `tmp-${nameUUID}$1`));
								const destFilePath = path.join(destFolderPath, destFileName);
								_htmls.push(`<img src="${destFileName}" style="${style}" >`);
								fs.writeFile(tmpFilePath, word.readFile(path.join('word', sourcePath)), err => {
									if (err) {
										console.error('', err);
										return;
									}
									let wmf2svg = spawn('wmf2gd', ['-t', 'png', '-o', destFilePath, '--maxpect', tmpFilePath]);

									// 捕获标准输出并将其打印到控制台 
									wmf2svg.stdout.on('data', function (data) {
										console.log('standard output:\n' + data);
									});
									// 捕获标准错误输出并将其打印到控制台 
									wmf2svg.stderr.on('data', function (data) {
										console.log('standard error output:\n' + data);
									});
									// 注册子进程关闭事件 
									wmf2svg.on('exit', function (code, signal) {
										console.log('child process eixt ,exit:' + code);
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
						typeStr = typeStr.slice(0, -1);
						if (typeStr === '单选题') {
							question.category = 1;
						} else if (typeStr === '多选题') {
							question.category = 2;
						} else if (typeStr === '判断题') {
							question.category = 3;
						} else if (typeStr === '填空题') {
							question.category = 4;
						} else if (typeStr === '简答题') {
							question.category = 5;
						}
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
						const destFilePath = path.join(destFolderPath, destFileName);
						_htmls.push(`<img src="${destFileName}">`);
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
								const tmpFilePath = path.join(destFolderPath, sourcePath.replace(/.*(\.[a-zA-Z0-9]+)$/, `${nameUUID}$1`));
								const destFilePath = path.join(destFolderPath, destFileName);
								_htmls.push(`<img src="${destFileName}" style="${style}" >`);
								fs.writeFile(tmpFilePath, word.readFile(path.join('word', sourcePath)), err => {
									if (err) {
										console.error('', err);
										return;
									}
									let wmf2svg = spawn('wmf2gd', ['-t', 'png', '-o', destFilePath, '--maxpect', tmpFilePath]);

									// 捕获标准输出并将其打印到控制台 
									wmf2svg.stdout.on('data', function (data) {
										console.log('standard output:\n' + data);
									});
									// 捕获标准错误输出并将其打印到控制台 
									wmf2svg.stderr.on('data', function (data) {
										console.log('standard error output:\n' + data);
									});
									// 注册子进程关闭事件 
									wmf2svg.on('exit', function (code, signal) {
										console.log('child process eixt ,exit:' + code);
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
console.log('Questions:', questions);

// fs.writeFile(path.join(destFolderPath, 'image2.wmf'), word.readFile('word/media/image2.wmf'));
// fs.writeFile(path.join(destFolderPath, 'image3.wmf'), word.readFile('word/media/image3.wmf'));
// //process.exit();