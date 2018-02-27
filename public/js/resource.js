'use static';
/* eslint-disable no-undef */
new Vue({
    el: '#app',
    data: function () {
        return {
            categories: {
                1: '课件',
                2: '视频',
                3: '教案',
                4: '试卷',
                5: '作业',
                6: '试题',
                7: '代码'
            },
            q: '',
            page: 1,
            total: 0,
            category: 0,
            searching: 0,
            resources: [],
            resource: {
                'name': '',
                'desc': '',
                'category': 1,
                'labels': [],
                'is_public': 2
            },
            tag: '',
            upsert: 0
        };
    },
    watch: {
        category: function () {
            let that = this;
            that.resources = [];
            that.total = 0;
            that.page = 1;
            that.search();
        },
        page: function () {
            let that = this;
            that.search();
        }
    },
    mounted: function () {
        this.search();
    },
    methods: {
        search: function () {
            var that = this;
            that.searching = 1;
            $.ajax({
                url: '/api/resources',
                type: 'GET',
                dataType: 'json',
                cache: false,
                data: {
                    q: that.q,
                    category: that.category,
                    page: that.page,
                },
                success: function (res) {
                    that.total = res.data.count;
                    that.resources = res.data.resources;
                }
            });
        },
        reload: function () {
            var that = this;
            that.go(1);
        },
        go: function (page) {
            var that = this;
            that.page = page;
            that.search();
        },
        del: function (resource) {
            var that = this;
            $.ajax({
                'url': '/api/resources/' + resource._id,
                'type': 'DELETE',
                'dataType': 'json',
                success: function (res) {
                    if (res.code === 0) {
                        alert('资源已删除');
                        that.search();
                    } else {
                        alert('删除失败');
                    }
                }
            });
        },
        offline: function (resource) {
            $.ajax({
                'url': '/api/resources/' + resource._id + '/offline',
                'type': 'PUT',
                'dataType': 'json',
                success: function (res) {
                    if (res.code === 0) {
                        alert('资源已下线');
                        resource.is_public = 2;
                    } else {
                        alert('下线失败');
                    }
                }
            });
        },
        online: function (resource) {
            $.ajax({
                'url': '/api/resources/' + resource._id + '/online',
                'type': 'PUT',
                'dataType': 'json',
                success: function (res) {
                    if (res.code === 0) {
                        alert('资源已上线');
                        resource.is_public = 1;
                    } else {
                        alert('上线失败');
                    }
                }
            });
        },
        download: function (resource) {
            $.ajax({
                'url': '/api/resources/' + resource._id + '/download',
                'type': 'GET',
                'cache': false,
                'dataType': 'json',
                success: function (res) {
                    if (res.code === 0) {
                        resource.download_num = res.data.download_num;
                    } else {
                        alert('下载失败');
                    }
                }
            });
        },
        pageview: function (resource) {
            $.ajax({
                'url': '/api/resources/' + resource._id + '/pageview',
                'type': 'GET',
                'cache': false,
                'dataType': 'json',
                success: function (res) {
                    if (res.code === 0) {
                        resource.pageview_num = res.data.pageview_num;
                    } else {
                        alert('预览失败');
                    }
                }
            });
        },
        edit: function (resource) {
            var that = this;
            that.resource.name = resource.name;
            that.resource.desc = resource.desc;
            that.resource.category = resource.category;
            that.resource.labels = resource.labels;
            that.resource._id = resource._id;
            that.resource.is_public = resource.is_public;
            that.upsert = 1;

            layer.open({
                type: 1,
                title: '修改资源',
                closeBtn: 0,
                area: '516px',
                skin: 'layui-layer-lan', //没有背景色
                shadeClose: false,
                content: $('#resource-upsert-form')
            });
        },
        add: function () {
            var that = this;
            that.upsert = 1;

            layer.open({
                type: 1,
                title: '添加资源',
                closeBtn: 0,
                area: '516px',
                skin: 'layui-layer-lan', //没有背景色
                shadeClose: false,
                content: $('#resource-upsert-form')
            });
        },
        cancelEdit: function () {
            layer.closeAll();
            var that = this;
            that.resource.name = '';
            that.resource.desc = '';
            that.resource.category = 1;
            that.resource.labels = [];
            that.resource._id = null;
            that.resource.is_public = 2;
            that.upsert = 0;
        },
        removeTag: function (index) {
            var that = this;
            that.resource.labels.splice(index, 1);
        },
        addTag: function () {
            var that = this;
            that.resource.labels.push(that.tag);
            that.tag = '';
        },
        save: function () {
            var that = this,
                data = {};
            data.name = that.resource.name;
            data.desc = that.resource.desc;
            data.category = that.resource.category;
            data.labels = that.resource.labels;
            data.is_public = that.resource.is_public;
            $.ajax({
                'url': '/api/resources/' + (that.resource._id ? that.resource._id : ''),
                'type': that.resource._id ? 'PUT' : 'POST',
                'dataType': 'json',
                'data': data,
                'success': function (res) {
                    if (res.code === 0) {
                        if (!that.resource._id) { //  新增
                            that.go(1);
                        } else { // 更新
                            that.search();
                        }
                        that.cancelEdit();
                    }
                }
            });
        }
    }
});