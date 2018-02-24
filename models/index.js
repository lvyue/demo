const db = require('../utils/db');

const Resource = require('./resource');
const Classify = require('./classify');

module.exports = {
    Resource: db.model('resources', Resource),
    Classify: db.model('classifies', Classify),
    Schema: {
        Resource,
        Classify
    }
};