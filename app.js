require("dotenv").config();
const MongoClient = require('mongodb').MongoClient;
const { exec } = require('child_process');
const fs = require('fs');
const ftp = require('basic-ftp');

// Credencials for database connection
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;
const dbHost = process.env.DB_HOST;
const dbName = process.env.DB_DBNAME;

const mongodbURI = `mongodb://${dbUser}:${dbPassword}@${dbHost}/${dbName}`;
const ftpConfig = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
};

async function backupAndUpload() {
    try {
        // Criar backup com mongodump
        const backupDir = '/dump';
        const backupCommand = `mongodump --uri="${mongodbURI}" --out=${backupDir}`;
        await execCommand(backupCommand);

        // Compactar backup (opcional)
        const tarCommand = `tar -zcvf ${backupDir}/backup.tar.gz ${backupDir}`;
        await execCommand(tarCommand);

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
        console.error('Erro:', error);
    }
}

function execCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout || stderr);
            }
        });
    });
}

backupAndUpload();
// Executar backup e upload a cada 30 minutos
//setInterval(backupAndUpload, 30 * 60 * 1000);