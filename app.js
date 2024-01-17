require("dotenv").config();
const { MongoClient } = require('mongodb');
const { exec } = require('child_process');
const ftp = require('basic-ftp');

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

async function backupAndUpload() {
    try {
        // Criar backup com mongodump
        const backupDir = '/dump';
        const backupCommand = `mongodump --uri="${mongodbURI}" --out=${backupDir}`;
        await execCommand(backupCommand, 'MongoDB Dump');

        // Compactar backup (opcional)
        const tarCommand = `tar -zcvf ${backupDir}/backup.tar.gz ${backupDir}`;
        await execCommand(tarCommand, 'Compress Backup');

        // Conectar ao servidor FTP
        const client = new ftp.Client();
        await client.access(ftpConfig);

        // Enviar arquivo para o servidor FTP
        const localFilePath = `${backupDir}/backup.tar.gz`;
        const remoteFilePath = `${process.env.FTP_DIR}/backup_${new Date().getTime()}.tar.gz`;
        await client.uploadFrom(localFilePath, remoteFilePath);

        // Fechar conexão FTP
        await client.close();

        console.log('Backup e upload concluídos com sucesso.');
    } catch (error) {
        console.error('Erro:', error.message);
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

backupAndUpload();
// Executar backup e upload a cada 30 minutos
// setInterval(backupAndUpload, 30 * 60 * 1000);