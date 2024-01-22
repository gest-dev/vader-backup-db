
const { exec } = require('child_process');
const { format } = require('date-fns');
const fs = require('fs').promises;
const path = require('path');

const { senMessageTelegran } = require('./Services/sendTelegramAlert')
const { uploadToFTP } = require('./Services/FTP');
const { uploadToSW3 } = require('./Services/S3Aws');
const { uploadToContabo } = require('./Services/ContaboAws');


// Credenciais para conexão com o banco de dados
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;
const dbHost = process.env.DB_HOST;
const dbName = process.env.DB_DBNAME;

const mongodbURI = `mongodb://${dbUser}:${dbPassword}@${dbHost}/${dbName}`;


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

        // Data hora atual
        const now = new Date();
        const formattedDate = format(now, 'dd_MM_yyyy-HH_mm_ss');

        // Enviar arquivo para o servidor FTP
        const localFilePath = `${dumpDir}/backup.tar.gz`;
        let detailMessage = {
            serverName: process.env.SERVER_NAME,
            type: 'Backup',
            sendType: process.env.SEND_TYPE,
            status: 'Success',
            message: `Backup e upload concluídos com sucesso!`,
            ETag: '',
            Location: '',
        }

        if (process.env.SEND_TYPE == 'FTP') {
            const remoteFilePath = `${process.env.FTP_DIR}/backup_${formattedDate}.tar.gz`;
            await uploadToFTP(localFilePath, remoteFilePath);
        }
        else if (process.env.SEND_TYPE == 'SW3') {
            await uploadToSW3(localFilePath, remoteFilePath);
        }
        else if (process.env.SEND_TYPE == 'CONTABO') {
            //CONTABO_DIR
            const remoteFilePath = `backup_${formattedDate}.tar.gz`;
            const result = await uploadToContabo(localFilePath, remoteFilePath);
            console.log(result);
            detailMessage.ETag = result.ETag;
            detailMessage.Location = result.Location;
            console.log(detailMessage);
        }
        else {
            console.log('Tipo de envio não configurado');
        }

        console.log(`Backup e upload concluídos com sucesso ${formattedDate}.`);
        await senMessageTelegran(detailMessage);

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