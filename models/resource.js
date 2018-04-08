const mongoose = require('mongoose');
const Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;
// 资源 数据表
let ResourceSchema = new Schema({
    // 资源
    name: {
        // 资源名称
        type: String
    },
    attach: {
        // 资源附件信息
        name: {
            // 名称
            type: String
        },
        url: {
            // 地址
            type: String
        },
        upload_time: {
            // 上传时间
            type: Date
        },
        size: {
            type: String
        }
    },
    category: {
        // 类型 1.课件 2.视频 3.教案 4.试卷 5.作业 6.试题 7.代码
        type: Number
    },
    classify: [
        {
            // 分类
            type: ObjectId,
            ref: 'classifies'
        }
    ],
    labels: [
        {
            // 标签
            type: String
        }
    ],
    desc: {
        // 简介
        type: String
    },
    is_public: {
        // 是否公开 1.公开 2 不公开
        type: Number,
        default: 2
    },
    score: {
        // 下载所需积分
        type: Number,
        default: 0
    },
    pageview_num: {
        // 浏览量
        type: Number,
        default: 0
    },
    download_num: {
        // 下载量
        type: Number,
        default: 0
    },
    // 点赞量
    // 踩量
    // 收藏量
    // 搜索量
    grade: {
        // 评分（平均分）
        type: Number,
        default: 0
    },
    // 评分次数
    // 举报次数
    status: {
        // 1,-1删除,2置顶
        type: Number,
        default: 1,
        enum: [1, -1]
    },
    create_time: {
        // 创建时间
        type: Date,
        default: Date.now
    },
    update_time: {
        // 更新时间
        type: Date,
        default: Date.now
    }
});

module.exports = ResourceSchema;
