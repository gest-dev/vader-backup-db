const mysqldump = require('mysqldump');
const { execCommand } = require('../utils/commandLib');

async function execConnectBackupMariaDb(host, port, user, password, database, dumpToFile) {
    try {
        if (process.env.DB_ACCESS_DUMP === 'application') {
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
            await mysqldump(dbConfig);
            console.log('Backup do banco de dados realizado com sucesso!');
        } else if (process.env.DB_ACCESS_DUMP === 'shell') {
            // Verificar se o mysqldump está instalado
            try {
                await execCommand('which mysqldump', 'Verificando se mysqldump está instalado');
            } catch (error) {
                console.error('mysqldump não encontrado. Por favor, instale o mysqldump.');
                throw new Error('mysqldump não encontrado');
            }


            // Executar o backup se mysqldump estiver instalado
            const command = `mysqldump -h ${host} -P ${port} -u ${user} -p${password} ${database} > ${dumpToFile}/backup.sql`;
            await execCommand(command, 'Executando mysqldump backup do banco de dados');

            console.log('Backup do banco de dados realizado com sucesso!');
        } else {
            console.error('Opção de backup não configurada corretamente. Por favor, configure a variável de ambiente DB_ACCESS_DUMP.');
            throw new Error('Opção de backup não configurada corretamente');
        }
    } catch (error) {
        console.error('Erro ao fazer backup do banco de dados:', error.message);
        throw new Error(error.messag);
    }
}

exports.execConnectBackupMariaDb = execConnectBackupMariaDb;
