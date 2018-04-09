'use static';
window.attach = JSON.parse($.trim($('#json').val()));
/* eslint-disable no-undef */
new Vue({
    el: '#app',
    data: function () {
        return {
            attach: {},
            source: { content: '' },
            targets: [],
            target: { file: { name: '' } },
            rate: 0
        };
    },
    mounted: function () {
        let that = this;
        that.attach = window.attach;
        that.targets = that.attach.rates.map(r => {
            r.rate = (r.rate * 100).toFixed(2) + '%';
            return r;
        });
        if (that.targets.length > 0) {
            that.target = that.targets[0];
            that.source.content = that.target.source;
            that.rate = that.target.rate;
        }
    },
    watch: {
        target: function () {
            let that = this;
            that.source.content = that.target.source;
            that.rate = that.target.rate;
        }
    }
});
