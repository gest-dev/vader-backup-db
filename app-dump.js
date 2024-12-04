require("dotenv").config();
const { CronJob } = require("cron");
const { exeDBDump } = require("./src/Controllers/DBDumpController");

const job = new CronJob(
    process.env.CRON_TIME || "1 1 */6 * * *", // Padrão de tempo
    async () => {
        try {
            console.log("Iniciando backup...");
            await exeDBDump(); // Executa a função como parte do cron job
            console.log("Backup concluído.");
        } catch (error) {
            console.error("Erro ao executar o backup:", error);
        }
    },
    null, // Função executada ao completar o cron (opcional)
    true, // Iniciar automaticamente
    "America/Sao_Paulo" // Fuso horário
);
