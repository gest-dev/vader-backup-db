require("dotenv").config();
const { CronJob } = require("cron");
const { exeDBDump } = require("./src/Controllers/DBDumpController");

const job = new CronJob(
    process.env.CRON_TIME || "0 */3 * * *", // Padrão de tempo
    exeDBDump, // Passar como referência, sem os parênteses
    null, // Função executada ao completar o cron (opcional)
    true, // Iniciar automaticamente
    "America/Sao_Paulo" // Fuso horário
);
