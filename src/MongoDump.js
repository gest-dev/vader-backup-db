
const { exec } = require('child_process');
const ftp = require('basic-ftp');
const { format } = require('date-fns');
const fs = require('fs').promises;
const path = require('path');
const { senMessageTelegran } = require('./Services/sendTelegramAlert')
const AWS = require('aws-sdk');


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

async function uploadToFTP(localFilePath, remoteFilePath) {

    try {
        const ftpConfig = {
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            port: process.env.FTP_PORT,
            password: process.env.FTP_PASS,
        };

        // Conectar ao servidor FTP
        const client = new ftp.Client();
        await client.access(ftpConfig);

        // Enviar arquivo para o servidor FTP
        await client.uploadFrom(localFilePath, remoteFilePath);
        // Fechar conexão FTP


        console.log(`Upload concluído com sucesso: ${remoteFilePath}`);
    } catch (error) {
        console.error(`Erro durante o upload para o FTP: ${error.message}`);
        throw error;
    } finally {
        // Fechar conexão FTP, independentemente do resultado
        await client.close();
    }
}
async function uploadToSW3(localFilePath, remoteFilePath) {
    try {
        // Configurar as credenciais AWS (configure-as com suas próprias credenciais)
        AWS.config.update({
            accessKeyId: 'SUA_ACCESS_KEY',
            secretAccessKey: 'SUA_SECRET_KEY',
            region: 'SUA_REGIAO', // por exemplo, 'us-east-1'
        });

        const s3 = new AWS.S3();

        // Parâmetros para upload
        const params = {
            Bucket: 'NOME_DO_SEU_BUCKET',
            Key: remoteFilePath,
            Body: await fs.readFile(localFilePath),
        };

        // Realizar o upload para o Amazon S3
        const result = await s3.upload(params).promise();

        console.log(`Upload para Amazon S3 concluído com sucesso: ${result.Location}`);
    } catch (error) {
        console.error(`Erro durante o upload para Amazon S3: ${error.message}`);
        throw error;
    }
}

async function uploadToContabo(localFilePath, remoteFilePath) {
    try {
        // Configurar as credenciais Contabo (substitua com suas próprias credenciais)
        AWS.config.update({
            accessKeyId: process.env.CONTABO_ACCESS_KEY_ID ,
            secretAccessKey: process.env.CONTABO_SECRET_ACCESS_KEY,
            region: process.env.CONTABO_REGION, // substitua pela região apropriada
        });

        const s3 = new AWS.S3({
            endpoint: process.env.CONTABO_ENDPOINT,
            s3ForcePathStyle: true,
        });

        // Parâmetros para upload
        const params = {
            Bucket: process.env.CONTABO_BUCKET, // substitua com o nome do bucket da Contabo
            Key: remoteFilePath,
            Body: await fs.readFile(localFilePath),
        };

        // Realizar o upload para a Contabo Storage
        const result = await s3.upload(params).promise();

        console.log(`Upload para Contabo Storage concluído com sucesso: ${result.Location}`);
    } catch (error) {
        console.error(`Erro durante o upload para Contabo Storage: ${error.message}`);
        throw error;
    }
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
        const remoteFilePath = `${process.env.FTP_DIR}/backup_${formattedDate}.tar.gz`;
        if (process.env.SEND_TYPE == 'FTP') {
            await uploadToFTP(localFilePath, remoteFilePath);            
        }
        else if (process.env.SEND_TYPE == 'SW3') {
            await uploadToSW3(localFilePath, remoteFilePath);
        }
        else if (process.env.SEND_TYPE == 'CONTABO') {
            await uploadToContabo(localFilePath, remoteFilePath);
        }
        else {
            console.log('Tipo de envio não configurado');
        }

        console.log(`Backup e upload concluídos com sucesso ${formattedDate}.`);

        let detailMessage = {
            serverName: process.env.SERVER_NAME,
            type: 'Backup',
            sendType: process.env.SEND_TYPE,
            status: 'Success',
            message: `Backup e upload concluídos com sucesso!`,
        }
        // senMessageTelegran(detailMessage);

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
        //senMessageTelegran(detailMessage);
        console.error('Erro:', error.message);
    }
}