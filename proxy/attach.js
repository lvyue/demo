const _ = require('lodash');
const models = require('../models');
const Attach = models.Attach;
const debug = require('debug')('attach');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const async = require('async');
const eventproxy = require('eventproxy');
const ADMZip = require('adm-zip');
const cheerio = require('cheerio');
const deepcopy = require('deepcopy');

const AP = {};
const destFolderPath = path.join(__dirname, '../upload');
const originPath = path.join(destFolderPath, 'origin'); // 原文件存储位置
AP.insert = function (attach, cb) {
  if (_.isFunction(attach)) {
    cb = attach;
    attach = null;
  }
  if (!_.isFunction(cb)) {
    cb = _.noop;
  }
  if (!_.isObject(attach) || _.isEmpty(attach)) {
    return cb(new Error('Attach is not an  object type or empty!'));
  }
  let att = new Attach(attach); // 生成model
  att.create_time = new Date();
  att.update_time = att.create_time;
  att.save(err => {
    if (err) return cb(err);
    AP.diff(att, cb);
  });
};
AP.update = function (id, attach, cb) {
  if (_.isFunction(attach)) {
    cb = attach;
    attach = null;
  }
  if (!_.isFunction(cb)) {
    cb = _.noop;
  }
  if (!_.isObject(attach) || _.isEmpty(attach)) {
    return cb(new Error('Attach is not an  object type or empty!'));
  }
  debug(attach);
  Attach.findByIdAndUpdate(
    {
      _id: id
    },
    {
      $set: attach
    },
        cb
    );
};

AP.query = function (query, select, options, callback) {
  if (_.isFunction(query)) {
    callback = query;
    query = {
      status: {
        $ne: -1
      }
    };
    select = {
      history: 0
    };
    options = {};
  }
  if (_.isFunction(select)) {
    callback = select;
    select = {
      history: 0
    };
    options = {};
  }
  if (_.isFunction(options)) {
    callback = options;
    options = {};
  }
  const cursor = Attach.find(query, select);
  if (options.populate) {
    cursor.populate(options.populate);
  }
  if (options.sort) {
    cursor.sort(options.sort);
  }
  if (options.skip) {
    cursor.skip(options.skip);
  }
  if (options.limit) {
    cursor.limit(options.limit);
  }
  cursor.exec(callback);
};

AP.findOne = function (query, select, options, callback) {
  if (_.isFunction(query)) {
    callback = query;
    query = {
      status: {
        $ne: -1
      }
    };
    select = {
      history: 0
    };
    options = {};
  } else if (_.isString(query)) {
    query = {
      _id: query,
      status: {
        $ne: -1
      }
    };
  } else if (!_.isObject(query)) {
    query = {
      status: {
        $ne: -1
      }
    };
  }
  if (_.isFunction(select)) {
    callback = select;
    select = {
      history: 0
    };
    options = {};
  } else if (!_.isObject(select)) {
    select = {
      history: 0
    };
  }
  if (_.isFunction(options)) {
    callback = options;
    options = {};
  } else if (!_.isObject(options)) {
    options = {};
  }

  if (!_.isFunction(callback)) {
    callback = _.noop;
  }
  const cursor = Attach.findOne(query, select);
  if (options.populate) {
    cursor.populate(options.populate);
  }
  cursor.exec(callback);
};

//
AP.count = function (query, callback) {
  if (_.isFunction(query)) {
    callback = query;
    query = {};
  }
  if (!_.isFunction(callback)) {
    callback = _.noop;
  }
  Attach.count(query, callback);
};

AP.offline = function (id, callback) {
  Attach.update(
    {
      _id: id,
      is_public: 1
    },
    {
      $set: {
        is_public: 2
      }
    },
        (err, rs) => {
          if (err) return debug(err), callback(err);
          debug(rs);
          callback(null, rs);
        }
    );
};

AP.online = function (id, callback) {
  Attach.update(
    {
      _id: id,
      is_public: 2
    },
    {
      $set: {
        is_public: 1
      }
    },
        (err, rs) => {
          if (err) return debug(err), callback(err);
          debug(rs);
          callback(null, rs);
        }
    );
};

AP.download = function (id, callback) {
  Attach.findOneAndUpdate(
    {
      _id: id,
      status: {
        $ne: -1
      }
    },
    {
      $inc: {
        download_num: 1
      }
    },
    {
      new: true,
      fields: {
        id: 1,
        is_public: 1,
        download_num: 1
      }
    },
        callback
    );
};

AP.pageview = function (id, callback) {
  Attach.findOneAndUpdate(
    {
      _id: id,
      status: {
        $ne: -1
      }
    },
    {
      $inc: {
        pageview_num: 1
      }
    },
    {
      new: true,
      fields: {
        id: 1,
        is_public: 1,
        pageview_num: 1
      }
    },
        callback
    );
};

AP.delete = function (id, callback) {
  Attach.findOneAndUpdate(
    {
      _id: id,
      status: {
        $ne: -1
      }
    },
    {
      $set: {
        status: -1
      }
    },
    {
      new: true,
      fields: {
        id: 1,
        is_public: 1
      }
    },
        callback
    );
};

AP.diff = function (base, callback) {
    // 转换成JSON
  let s = base.toJSON();
  s.main = true;
  Attach.find({ _id: { $ne: base._id }, status: 1 }, { rates: 0, create_time: 0, update_time: 0 }, (err, attaches) => {
    if (err) return debug(err), callback(err);
    if (attaches.length === 0) return callback(undefined, base);
    let files = attaches.map(a => a.toJSON());
    files.unshift(s);
    async.mapLimit(
            files,
            5,
            (file, done) => {
                // 本地路径
              if (!file.localPath) file.localPath = path.join(originPath, file.path);
              file.rates = [];
              const proxy = eventproxy.create(['stat', 'hash', 'contents'], (stat, hash, contents) => {
                file.stat = stat;
                file.hash = hash;
                file.contents = contents;
                done(undefined, file);
              });
              proxy.fail(err => {
                debug('PROXY:', err);
                done(undefined, file);
              });
              if (!file.stat) {
                    // 获取文件信息
                fs.stat(file.localPath, (err, stat) => {
                  if (err) debug('HASH', err);
                  debug('stat');
                  proxy.emit('stat', stat);
                });
              } else {
                proxy.emit('stat', file.stat);
              }
              if (!file.hash) {
                    // 获取文件信息
                fs.readFile(file.localPath, (err, buf) => {
                  if (err) {
                    debug(err);
                    return proxy.emit('hash', '');
                  }
                  const md5 = crypto.createHash('md5');
                  md5.update(buf);
                  debug('hash');
                  return proxy.emit('hash', md5.digest('hex'));
                });
              } else {
                proxy.emit('hash', file.hash);
              }

              if (!file.contents || file.contents.length === 0) {
                    // 获取文件信息
                const word = new ADMZip(file.localPath);
                file.content = cheerio.load(word.readAsText('word/document.xml')).text();
                debug('content:', file.content);
                proxy.emit(
                        'contents',
                        _.compact(file.content.replace(/([,.!?，。？；;])/gi, '$1$@=@$').split('$@=@$')).map(c => ({
                          content: c.substring(0, c.length - 1),
                          punctuation: c.substr(-1)
                        }))
                    );
              } else {
                proxy.emit('contents', file.contents);
              }
            },
            (err, stats) => {
              let source = stats.shift();
              async.mapLimit(
                    stats,
                    5,
                    (target, done) => {
                      if (source.stat && target.stat) {
                            // 判断字节数是否相同
                        if (source.stat.size === target.stat.size) {
                          if (source.hash === target.hash) {
                            source.rates.push({
                              file: target._id,
                              rate: 1,
                              source: `<em>${source.content}</em>`,
                              target: `<em>${target.content}</em>`
                            });
                            target.rates.push({
                              file: source._id,
                              rate: 1,
                              source: `<em>${target.content}</em>`,
                              target: `<em>${source.content}</em>`
                            });
                            return done(undefined, target);
                          }
                        }
                        if (source.content === target.content) {
                          source.rates.push({
                            file: target._id,
                            rate: 1,
                            source: `<em>${source.content}</em>`,
                            target: `<em>${target.content}</em>`
                          });
                          target.rates.push({
                            file: source._id,
                            rate: 1,
                            source: `<em>${target.content}</em>`,
                            target: `<em>${source.content}</em>`
                          });
                          return done(undefined, target);
                        }
                            // 重复计数
                        let repeatCount = 0;
                            // 目标文本
                        let targetContents = [];
                            // 源文本
                        let sourceContents = [];
                            // 目标缓存
                        let sourceCache = source.contents.reduce((pre, val, index) => {
                          pre[val.content] = index;
                          sourceContents.push(deepcopy(val));
                          return pre;
                        }, {});
                        debug('TARGET:', target.contents);
                            // 目标筛选
                        target.contents.forEach(c => {
                          let index = sourceCache[c.content];
                                // 有数据
                          if (index >= 0) {
                            repeatCount++;
                            sourceContents[index].content = `<em>${c.content}</em>`;
                            targetContents.push({ content: `<em>${c.content}</em>`, punctuation: c.punctuation });
                          } else {
                            targetContents.push(c);
                          }
                        });
                        source.rates.push({
                          file: target._id,
                          rate: repeatCount / source.contents.length,
                          source: sourceContents.map(c => c.content + c.punctuation).join(''),
                          target: targetContents.map(c => c.content + c.punctuation).join('')
                        });
                        target.rates.push({
                          file: source._id,
                          rate: repeatCount / target.contents.length,
                          source: targetContents.map(c => c.content + c.punctuation).join(''),
                          target: sourceContents.map(c => c.content + c.punctuation).join('')
                        });
                        return done(undefined, target);
                            // 处理内容
                      } else {
                        source.rates.push({
                          file: target._id,
                          rate: 0,
                          source: source.content,
                          target: target.content
                        });
                        target.rates.push({
                          file: source._id,
                          rate: 0,
                          source: target.content,
                          target: source.content
                        });
                        done(undefined, target);
                      }
                    },
                    (err, files) => {
                      if (err) return debug(err), callback(err);
                      files.unshift(source);
                        // debug(files);
                      async.eachLimit(
                            files,
                            3,
                            (attach, done) => {
                              Attach.update(
                                    { _id: attach._id },
                                {
                                  $set: {
                                    hash: attach.hash,
                                    content: attach.content,
                                    contents: attach.contents
                                  }, // 写入结果
                                  $addToSet: {
                                    rates: {
                                      $each: attach.rates
                                    }
                                  }
                                },
                                    done
                                );
                            },
                            err => {
                              if (err) return debug(err), callback(err);
                              callback(undefined, base);
                            }
                        );
                    }
                );
            }
        );
  });
};

module.exports = AP;
