const AWS = require('aws-sdk');


async function uploadToContabo(localFilePath, remoteFilePath) {
    try {
        // Configurar as credenciais Contabo (substitua com suas próprias credenciais)
        AWS.config.update({
            accessKeyId: process.env.CONTABO_ACCESS_KEY_ID,
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
        return result;

    } catch (error) {
        console.error(`Erro durante o upload para Contabo Storage: ${error.message}`);
        throw error;
    }
}
exports.uploadToContabo = uploadToContabo;