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
            resources: []
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
                url: '/api/resources/search',
                type: 'GET',
                dataType: 'json',
                cache: false,
                data: {
                    q: that.q,
                    category: that.category,
                    page: that.page,
                },
                success: function (res) {
                    that.total = res.data.total;
                    that.resources = res.data.hits;
                    setTimeout(() => {
                        that.searching = 0;
                    }, 1000);
                }
            });
        },
        reload: function () {
            var that = this;
            that.page = 1;
            that.search();
        }
    }
});