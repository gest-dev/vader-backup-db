
const { exec } = require('child_process');
const { format } = require('date-fns');
const fs = require('fs').promises;
const path = require('path');

/* Alert */
const { senMessageTelegran } = require('../Services/alert/sendTelegramAlert')
const { senAlertApiWhatsapp } = require('../Services/alert/sendAlertApiWhatsapp')
/* Upload server */
const { uploadToFTP } = require('../Services/uplaod_service/FTP');
const { uploadToAwsS3 } = require('../Services/uplaod_service/AwsS3');
const { uploadToContaboStorage } = require('../Services/uplaod_service/ContaboStorage');
const { uploadToMinioStorage } = require('../Services/uplaod_service/MinioStorage');
/* Dump Databases */
const { execConnectBackupMongo } = require('../Services/database/execConnectBackupMongo');
const { execConnectBackupMariaDb } = require('../Services/database/execConnectBackupMariaDb');

// credentials database
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;
const dbHost = process.env.DB_HOST;
const dbName = process.env.DB_DBNAME;
const dbPort = process.env.DB_PORT;
const dbType = process.env.DB_TYPE;

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

async function ensureDirectoryExists(directory) {
    try {
        await fs.access(directory);
        //limpa o conteudo da pasta se existir
        await cleanDirectory(directory);
    } catch (error) {
        // Se ocorrer um erro, a pasta não existe e será criada
        await fs.mkdir(directory);
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

async function fileSizeInfo(localFilePath) {

    try {
        // Obtendo informações do arquivo
        const stats = await fs.stat(localFilePath);
        // Tamanho do arquivo em bytes
        const tamanhoDoArquivoEmBytes = stats.size;

        // Convertendo bytes para kilobytes
        const tamanhoDoArquivoEmKB = tamanhoDoArquivoEmBytes / 1024;

        return {
            size: tamanhoDoArquivoEmBytes,
            sizeKB: tamanhoDoArquivoEmKB.toFixed(2) + ' KB',
        };
    } catch (err) {
        console.error('Erro ao obter informações do arquivo:', err);
        throw err;
    }
}


exports.exeDBDump = async () => {

    try {
        // Criar backup com mongodump
        const dumpDir = 'dump';
        const tempBackupDir = 'temp';
        // Criar as pastas se não existirem
        await ensureDirectoryExists(dumpDir);
        await ensureDirectoryExists(tempBackupDir);

        // Executar backup Mongo
        if (dbType == 'mongo') {
            await execConnectBackupMongo(dbHost, dbPort, dbUser, dbPassword, dbName, tempBackupDir);
        } else if (dbType == 'mariadb' || dbType == 'mysql') {
            //Executar backup MySQL - MariaDB
            await execConnectBackupMariaDb(dbHost, dbPort, dbUser, dbPassword, dbName, tempBackupDir);
        }

        // Compactar backup
        const tarCommand = `tar -zcvf ${dumpDir}/backup.tar.gz -C ${tempBackupDir} .`;
        await execCommand(tarCommand, 'Compress Backup');

        // Data hora atual
        const now = new Date();
        const formattedDate = format(now, 'dd_MM_yyyy-HH_mm_ss');

        //Enviar arquivo para o servidor FTP
        const localFilePath = `${dumpDir}/backup.tar.gz`;
        let infoFileSize = await fileSizeInfo(localFilePath);

        let detailMessage = {
            serverName: process.env.SERVER_NAME,
            type: 'Backup',
            sendType: process.env.SEND_TYPE,
            status: 'Success',
            message: `Backup e upload sent success!`,
            ETag: '',
            Location: '',
        }
        /* Upload file BK */
        if (process.env.SEND_TYPE == 'ftp') {
            const remoteFilePath = `${process.env.SERVER_NAME}_${formattedDate}.tar.gz`;

            await uploadToFTP(localFilePath, `${process.env.FTP_DIR}/${remoteFilePath}`);
            detailMessage.FileName = remoteFilePath;
            detailMessage.size = infoFileSize.sizeKB ?? '---';
        }
        else if (process.env.SEND_TYPE == 'aws-s3') {
            const remoteFilePath = `${process.env.SERVER_NAME}_${formattedDate}.tar.gz`;

            const result = await uploadToAwsS3(localFilePath, remoteFilePath);
            detailMessage.FileName = remoteFilePath;
            detailMessage.size = infoFileSize.sizeKB ?? '---';
            detailMessage.ETag = result.ETag?.replace(/"/g, '');
            detailMessage.Location = result.Location ?? '---';
        }
        else if (process.env.SEND_TYPE == 'contabo') {

            const remoteFilePath = `${process.env.SERVER_NAME}_${formattedDate}.tar.gz`;
            const result = await uploadToContaboStorage(localFilePath, remoteFilePath);

            detailMessage.FileName = remoteFilePath;
            detailMessage.size = infoFileSize.sizeKB ?? '---';
            detailMessage.ETag = result.ETag?.replace(/"/g, '');
            detailMessage.Location = result.Location ?? '---';

        } else if (process.env.SEND_TYPE == 'minio') {

            const remoteFilePath = `${process.env.SERVER_NAME}_${formattedDate}.tar.gz`;
            const result = await uploadToMinioStorage(localFilePath, remoteFilePath);

            detailMessage.FileName = remoteFilePath;
            detailMessage.size = infoFileSize.sizeKB ?? '---';
            detailMessage.ETag = result.ETag?.replace(/"/g, '');
            detailMessage.Location = result.Location ?? '---';
        }
        else {
            console.log('Tipo de envio não configurado');
        }
        console.log(`Backup e upload concluídos com sucesso ${formattedDate}.`);

        if (process.env.SEND_ALERT_TELEGRAM == 'true') {
            await senMessageTelegran(detailMessage);
        }
        if (process.env.SEND_ALERT_WHATSAPP == 'true') {
            await senAlertApiWhatsapp(detailMessage);
        }

        // Limpar o conteúdo da pasta temp
        await cleanDirectory(tempBackupDir);

        // Limpar o conteúdo da pasta dump
        await cleanDirectory(dumpDir);
    } catch (error) {
        const errorMessage = error.message.length > 20 ? error.message.slice(0, 20) + '...' : error.message;
        let detailMessage = {
            serverName: process.env.SERVER_NAME,
            type: 'Backup',
            sendType: process.env.SEND_TYPE,
            status: 'Error',
            message: `Erro ao executar backup e upload: ${errorMessage}`,
        }

        if (process.env.SEND_ALERT_TELEGRAM == 'true') {
            await senMessageTelegran(detailMessage);
        }
        if (process.env.SEND_ALERT_WHATSAPP == 'true') {
            await senAlertApiWhatsapp(detailMessage);
        }

        console.error('Erro:', error.message);
    }
}