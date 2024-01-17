const cronJob = require("cron").job;
// Webscraping Imports
const MongoDump = require("./MongoDump");

MongoDump.exeMongodump();
cronJob(
    "0 */6 * * *",
    () => {
        MongoDump.exeMongodump();
    },
    null,
    true
);
