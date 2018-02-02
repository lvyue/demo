'use static';
new Vue({
    el: '#app',
    data: function () {
        return {
            'content': '',
            'result': '',
            'resultClass': ''
        };
    },
    methods: {
        'filter': function () {
            var that = this;
            if (that.content.length > 0) {
                $.ajax({
                    url: '/filter',
                    type: 'POST',
                    data: {
                        content: that.content
                    },
                    dataType: 'json',
                    success: function (data) {
                        if (data.msg) {
                            that.resultClass = 'alert-danger';
                            that.result = '内容包含“' + data.msg + '”信息';
                        } else {
                            that.resultClass = 'alert-success';
                            that.result = '内容合法';
                        }
                    }
                });
            } else {
                alert('请输入文本内容');
            }
        }
    }
});