const { MongoClient, ObjectId } = require('mongodb');
const { EJSON } = require('bson');
const fs = require('fs');
const { execCommand } = require('../utils/commandLib');


async function execConnectBackupMongo(dbHost, dbPort, dbUser, dbPassword, dbName, tempBackupDir) {

    let client = null;

    try {
        const mongodbURI = `mongodb://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
        client = new MongoClient(mongodbURI);
        if (process.env.DB_ACCESS_DUMP === 'shell') {
            // Verificar se o mongoexport está instalado
            try {
                await execCommand('which mongoexport', 'Verificando se mongoexport está instalado');
            } catch (error) {
                console.error('mongoexport não encontrado. Por favor, instale o mongoexport.');
                throw new Error('mongoexport não encontrado');
            }

            // Conectar ao MongoDB para obter a lista de coleções

            await client.connect();
            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();

            for (const collection of collections) {
                const collectionName = collection.name;
                const outputPath = `${tempBackupDir}/${dbName}_${collectionName}.json`;
                const backupCommand = `mongoexport --host ${dbHost} --port ${dbPort} --username ${dbUser} --password ${dbPassword} --db ${dbName} --collection ${collectionName} --out ${outputPath}`;

                console.log(backupCommand);
                await execCommand(backupCommand, `Executando backup da coleção ${collectionName}`);
            }

            console.log('Backup do MongoDB realizado com sucesso usando mongoexport!');

        } else if (process.env.DB_ACCESS_DUMP === 'application') {

            // Conexão via MongoClient e backup manual das coleções
            await client.connect();
            const database = client.db(dbName);
            const collections = await database.listCollections().toArray();

            // Verificar se o diretório de backup existe, caso contrário, criar
            if (!fs.existsSync(tempBackupDir)) {
                fs.mkdirSync(tempBackupDir, { recursive: true });
            }

            for (const collectionInfo of collections) {
                const collectionName = collectionInfo.name;
                const backupData = await database.collection(collectionName).find().toArray();

                const backupFilePath = `${tempBackupDir}/${collectionName}.json`;

                // Serializar os dados com EJSON para preservar tipos de dados específicos do MongoDB
                const serializedData = EJSON.stringify(backupData, { relaxed: false });
                fs.writeFileSync(backupFilePath, serializedData);

                console.log(`Backup da coleção ${collectionName} realizado com sucesso em ${backupFilePath}`);
            }

            console.log('Backup de todas as coleções realizado com sucesso!');
        } else {
            console.log('Tipo de acesso ao banco de dados não definido');
            throw new Error('Tipo de acesso ao banco de dados não definido');
        }
    } catch (error) {
        console.error('Erro ao fazer backup:', error.message);
        const errorMessage = error.message || 'Erro ao fazer backup do banco de dados';
        throw new Error(errorMessage);
    } finally {
        await client.close();
    }
}

exports.execConnectBackupMongo = execConnectBackupMongo;
