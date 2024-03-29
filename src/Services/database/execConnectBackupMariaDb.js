const mysqldump = require('mysqldump');

async function execConnectBackupMariaDb(host, port, user, password, database, dumpToFile) {

    const dbConfig = {
        connection: {
            host: host,
            port: port,
            user: user,
            password: password,
            database: database
        },
        dumpToFile: dumpToFile + '/backup.sql'
    };

    try {
        await mysqldump(dbConfig);
        console.log('Backup do banco de dados realizado com sucesso!');
    } catch (error) {
        throw new Error('Erro ao fazer backup do banco de dados:', error);
    }
}


exports.execConnectBackupMariaDb = execConnectBackupMariaDb;