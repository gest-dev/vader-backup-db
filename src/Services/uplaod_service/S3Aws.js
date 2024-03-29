const AWS = require('aws-sdk');
const fs = require('fs').promises;

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

exports.uploadToSW3 = uploadToSW3;
