let config = {
    //server port
    debug: true,
    port: 3000,
    //数据库重连时间
    reConnectTime: 30000,
    database: {
        servers: [
            '127.0.0.1:27017'
        ],
        'user': 'demo',
        'pass': 'demo',
        'db': 'demo',
        'opts': {}
    },
    es: {
        host: '127.0.0.1:19200',
        index: 'demo',
        type: 'resource'
    }
};

let _servers = config.database.servers.join(',');
let _opts = config.database.query ? `?${config.database.query}` : '';
config.dbURI = `mongodb://${config.database.user}:${config.database.pass}@${_servers}/${config.database.db}${_opts}`;
module.exports = Object.freeze(_.clone(config));