require("dotenv").config();
const { CronJob } = require("cron");
const { exeDBDump } = require("./src/Controllers/DBDumpController");

// Ajuste no CronJob
const job = new CronJob(
    `${process.env.CRON_TIME || "1 1 */6 * * *"}`, // Padrão de tempo
    exeDBDump, // Passe a função como referência, sem parênteses
    null, // Função de callback "onComplete"
    true, // Inicia o job automaticamente
    "America/Sao_Paulo" // Fuso horário
);
//job.start(); // Start the job right now