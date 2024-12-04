require("dotenv").config();
const { CronJob } = require("cron");
const { exeDBDump } = require("./src/Controllers/DBDumpController");

const job = new CronJob(
    `${process.env.CRON_TIME || "1 1 */6 * * *"}`, // Padrão de agendamento
    async () => {
        try {
            await exeDBDump(); // Aguarde a execução da função assíncrona
        } catch (error) {
            console.error("Erro no cron job:", error);
        }
    },
    null, // Função para "onComplete"
    true, // Iniciar o cron automaticamente
    "America/Sao_Paulo" // Fuso horário
);

// O cron job já será iniciado automaticamente devido ao parâmetro `true`
// job.start(); // Opcional, já iniciado automaticamente
