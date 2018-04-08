const db = require('../utils/db');

const Resource = require('./resource');
const Classify = require('./classify');
const Attach = require('./attach');

module.exports = {
    Resource: db.model('resources', Resource),
    Classify: db.model('classifies', Classify),
    Attach: db.model('attaches', Attach),
    Schema: {
        Resource,
        Classify,
        Attach
    }
};
