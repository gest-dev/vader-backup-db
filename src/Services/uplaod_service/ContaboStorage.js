const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require('fs').promises;

async function uploadToContaboStorage(localFilePath, remoteFilePath) {
    try {
        // Configurar as credenciais Contabo (substitua com suas próprias credenciais)
        const s3Client = new S3Client({
            region: process.env.CONTABO_REGION, // substitua pela região apropriada
            credentials: {
                accessKeyId: process.env.CONTABO_ACCESS_KEY_ID,
                secretAccessKey: process.env.CONTABO_SECRET_ACCESS_KEY,
            },
            endpoint: process.env.CONTABO_ENDPOINT,
            forcePathStyle: true
        });

        // Leitura do arquivo local como uma stream
        const fileStream = await fs.readFile(localFilePath);

        // Parâmetros para upload
        const params = {
            Bucket: process.env.CONTABO_BUCKET, // substitua com o nome do bucket da Contabo
            Key: remoteFilePath,
            Body: fileStream,
        };

        // Realizar o upload para a Contabo Storage
        const command = new PutObjectCommand(params);
        const response = await s3Client.send(command);
        
        return response;

    } catch (error) {
        console.error(`Erro durante o upload para Contabo Storage: ${error.message}`);
        throw error;
    }
}

exports.uploadToContaboStorage = uploadToContaboStorage;