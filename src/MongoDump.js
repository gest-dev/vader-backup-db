
const { exec } = require('child_process');
const ftp = require('basic-ftp');
const { format } = require('date-fns');
const fs = require('fs').promises;
const path = require('path');
const { senMessageTelegran } = require('./Services/sendTelegramAlert')


// Credenciais para conexão com o banco de dados
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;
const dbHost = process.env.DB_HOST;
const dbName = process.env.DB_DBNAME;

const mongodbURI = `mongodb://${dbUser}:${dbPassword}@${dbHost}/${dbName}`;
const ftpConfig = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    port: process.env.FTP_PORT,
    password: process.env.FTP_PASS,
};


async function ensureDirectoryExists(directory) {
    try {
        await fs.access(directory);
    } catch (error) {
        // Se ocorrer um erro, a pasta não existe e será criada
        await fs.mkdir(directory);
    }
}

async function cleanDirectory(directory) {
    const files = await fs.readdir(directory);

    for (const file of files) {
        const filePath = path.join(directory, file);
        const stat = await fs.stat(filePath);

        if (stat.isDirectory()) {
            // Se for um diretório, chama cleanDirectory recursivamente
            await cleanDirectory(filePath);
        } else {
            // Se for um arquivo, usa unlink para excluir
            await fs.unlink(filePath);
        }
    }
}

function execCommand(command, operation) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`${operation} Error:`, error.message);
                reject(error);
            } else {
                console.log(`${operation} Output:`, stdout || stderr);
                resolve(stdout || stderr);
            }
        });
    });
}


exports.exeMongodump = async () => {

    try {
        // Criar backup com mongodump
        const dumpDir = 'dump';
        const tempBackupDir = 'temp';
        // Criar as pastas se não existirem
        await ensureDirectoryExists(dumpDir);
        await ensureDirectoryExists(tempBackupDir);

        // Executar o comando de backup
        const backupCommand = `mongodump --uri="${mongodbURI}" --out=${tempBackupDir}`;
        await execCommand(backupCommand, 'MongoDB Dump');

        // Compactar backup
        const tarCommand = `tar -zcvf ${dumpDir}/backup.tar.gz -C ${tempBackupDir} .`;
        await execCommand(tarCommand, 'Compress Backup');

        // Conectar ao servidor FTP
        const client = new ftp.Client();
        await client.access(ftpConfig);

        // Data hora atual
        const now = new Date();
        const formattedDate = format(now, 'dd_MM_yyyy-HH_mm_ss');

        // Enviar arquivo para o servidor FTP
        const localFilePath = `${dumpDir}/backup.tar.gz`;
        const remoteFilePath = `${process.env.FTP_DIR}/backup_${formattedDate}.tar.gz`;
        await client.uploadFrom(localFilePath, remoteFilePath);

        // Fechar conexão FTP
        await client.close();

        console.log(`Backup e upload concluídos com sucesso ${formattedDate}.`);

        let detailMessage = {
            serverName: process.env.SERVER_NAME,
            type: 'Backup',
            sendType: process.env.SEND_TYPE,
            status: 'Success',
            message: `Backup e upload concluídos com sucesso!`,
        }
        senMessageTelegran(detailMessage);
        // Limpar o conteúdo da pasta temp
        await cleanDirectory(tempBackupDir);

        // Limpar o conteúdo da pasta dump
        await cleanDirectory(dumpDir);
    } catch (error) {

        let detailMessage = {
            serverName: process.env.SERVER_NAME,
            type: 'Backup',
            sendType: process.env.SEND_TYPE,
            status: 'Error',
            message: `Erro ao executar backup e upload: ${error.message}`,
        }
        senMessageTelegran(detailMessage);
        console.error('Erro:', error.message);
    }
}