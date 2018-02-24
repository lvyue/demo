const mongoose = require('mongoose');
const Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;
//资源分类 数据表
let ClassifySchema = new Schema({
    parent_id: { // 父级id
        type: ObjectId,
        ref: 'classifies'
    },
    name: { //分类名称
        type: String
    },
    status: { //状态:1 正常,－1删除
        type: Number,
        default: 1,
        enum: [1, -1]
    },
    create_time: { //创建时间
        type: Date,
        default: Date.now
    },
    update_time: { //更新时间
        type: Date,
        default: Date.now
    },
});

module.exports = ClassifySchema;