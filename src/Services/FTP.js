const ftp = require('basic-ftp');

async function uploadToFTP(localFilePath, remoteFilePath) {
    // Conectar ao servidor FTP
    const client = new ftp.Client();
    try {
        const ftpConfig = {
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            port: process.env.FTP_PORT,
            password: process.env.FTP_PASS,
        };
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
exports.uploadToFTP = uploadToFTP;