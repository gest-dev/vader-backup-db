require("dotenv").config();
const { CronJob } = require("cron");
const { exeDBDump } = require("./src/Controllers/DBDumpController");

//exeDBDump();
const job = new CronJob(
    `${process.env.CRON_TIME || "1 1 */6 * * *"}`,
    exeDBDump(), // The function to execute
    null, // On complete function
    true, // Start the job right now
    "America/Sao_Paulo"
);
//job.start(); // Start the job right now