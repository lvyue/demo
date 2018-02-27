'use static';
/* eslint-disable no-undef */
new Vue({
    el: '#app',
    data: function () {
        return {
            tables: [],
            row: {
                name: '',
                age: 0,
            }
        };
    },
    watch: {

    },
    mounted: function () {},
    methods: {
        addTable: function () {
            var that = this;
            that.tables.push({
                rows: []
            });
        },
        saveTable: function (table) {
            alert(JSON.stringify(table));
        },
        delTable: function (index) {
            var that = this;
            that.tables.splice(index, 1);
        },
        addRow: function (table) {
            table.rows.push({
                'name': '',
                'age': 1,
                'edit': 1,
            });
        },
        editRow: function (row) {
            row.name = '熊大' + Math.ceil(Math.random() * 100) + '号';
            row.age = Math.ceil(Math.random() * 100);
        },
        delRow: function (table, index) {
            table.rows.splice(index, 1);
        },
        saveRow: function (row) {
            row.edit = 0;
        }
    }
});