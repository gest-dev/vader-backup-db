require("dotenv").config();
const cronJob = require("cron").job;
const { exeDBDump } = require("./src/Controllers/DBDumpController");

exeDBDump();
cronJob(
    `${process.env.CRON_TIME || "1 1 */6 * * *"}`,// Default is every 6 hours
    () => {
        exeDBDump();
    },
    null,
    true
);
