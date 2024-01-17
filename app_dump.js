require("dotenv").config();
const cronJob = require("cron").job;
// Webscraping Imports
const MongoDump = require("./src/MongoDump");

MongoDump.exeMongodump();
cronJob(
    `${process.env.CRON_TIME}`,
    () => {
        MongoDump.exeMongodump();
    },
    null,
    true
);
