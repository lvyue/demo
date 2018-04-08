const mongoose = require('mongoose');
const Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;
// 资源 数据表
let AttachSchema = new Schema({
    // 资源名称
    name: {
        type: String
    }, // 大小
    length: {
        type: Number,
        default: 0
    }, // mime
    mime: {
        type: String,
        default: ''
    },
    hash: {
        type: String,
        default: ''
    }, // hash 值
    path: {
        type: String,
        default: ''
    }, // 文本内容
    content: {
        type: String,
        default: ''
    }, // 文本内容 使用标点符号进行拆分
    contents: [
        {
            content: {
                type: String,
                default: ''
            },
            punctuation: {
                type: String,
                default: ''
            }
        }
    ], // 重复率
    rates: [
        {
            // 目标文件
            file: {
                type: ObjectId,
                refs: 'attaches'
            }, // 重复率
            rate: {
                type: Number,
                default: 0
            }, // 源文件重复标记
            source: {
                type: String,
                default: ''
            }, // 目标文件重复标记
            target: {
                type: String,
                default: ''
            }
        }
    ], // 1,-1删除,
    status: {
        type: Number,
        default: 1,
        enum: [1, -1]
    }, // 创建时间
    create_time: {
        type: Date,
        default: Date.now
    }, // 更新时间
    update_time: {
        type: Date,
        default: Date.now
    }
});

module.exports = AttachSchema;
