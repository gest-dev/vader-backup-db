const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require('fs').promises;

async function uploadToMinioStorage(localFilePath, remoteFilePath) {
    try {
        // Configurar as credenciais Minio(S3) (substitua com suas próprias credenciais)
        const s3Client = new S3Client({
            region: process.env.S3_STORAGE_REGION, // substitua pela região apropriada
            credentials: {
                accessKeyId: process.env.S3_STORAGE_ACCESS_KEY_ID,
                secretAccessKey: process.env.S3_STORAGE_SECRET_ACCESS_KEY,
            },
            endpoint: process.env.S3_STORAGE_ENDPOINT,
            forcePathStyle: true,
            signatureVersion: 'v4' 
        });

        // Leitura do arquivo local como uma stream
        const fileStream = await fs.readFile(localFilePath);

        // Parâmetros para upload
        const params = {
            Bucket: process.env.S3_STORAGE_BUCKET, // substitua com o nome do bucket da Minio(S3)
            Key: remoteFilePath,
            Body: fileStream,
        };

        // Realizar o upload para a Minio(S3) Storage
        const command = new PutObjectCommand(params);
        const response = await s3Client.send(command);
        
        return response;

    } catch (error) {
        console.error(`Erro durante o upload para Minio(S3) Storage: ${error.message}`);
        throw error;
    }
}

exports.uploadToMinioStorage = uploadToMinioStorage;