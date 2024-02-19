require("dotenv").config();
const cronJob = require("cron").job;
// Webscraping Imports
const MongoDump = require("./src/MongoDump");

MongoDump.exeMongodump();
cronJob(
    `${process.env.CRON_TIME || "1 1 */6 * * *"}`,
    () => {
        MongoDump.exeMongodump();
    },
    null,
    true
);

