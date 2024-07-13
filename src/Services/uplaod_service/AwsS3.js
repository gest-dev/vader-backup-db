const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require('fs').promises;

async function uploadToAwsS3(localFilePath, remoteFilePath) {
    try {
        // Configurar as credenciais Contabo (substitua com suas próprias credenciais)
        const s3Client = new S3Client({
            region: process.env.S3_STORAGE_REGION, // substitua pela região apropriada
            credentials: {
                accessKeyId: process.env.S3_STORAGE_ACCESS_KEY_ID,
                secretAccessKey: process.env.S3_STORAGE_SECRET_ACCESS_KEY,
            },
            endpoint: process.env.S3_STORAGE_ENDPOINT,
            forcePathStyle: true
        });

        // Leitura do arquivo local como uma stream
        const fileStream = await fs.readFile(localFilePath);

        // Parâmetros para upload
        const params = {
            Bucket: process.env.S3_STORAGE_BUCKET, // substitua com o nome do bucket da Contabo
            Key: remoteFilePath,
            Body: fileStream,
        };

        // Realizar o upload para a Contabo Storage
        const command = new PutObjectCommand(params);
        const response = await s3Client.send(command);

        return response;

    } catch (error) {
        console.error(`Erro durante o upload para Amazon S3: ${error.message}`);
        throw error;
    }
}

exports.uploadToAwsS3 = uploadToAwsS3;
