let config = {
    //server port
    debug: true,
    port: 3000,
    //数据库重连时间
    reConnectTime: 30000,
    database: {
        servers: [
            '192.168.0.128:27017'
        ],
        db: 'demo',
        opts: {}
    },
    es: {
        host: '192.168.0.128:19200',
        index: 'demo',
        type: 'resource'
    }
};

let _servers = config.database.servers.join(',');
let _opts = config.database.query ? `?${config.database.query}` : '';
config.dbURI = `mongodb://${_servers}/${config.database.db}${_opts}`;
module.exports = Object.freeze(config);