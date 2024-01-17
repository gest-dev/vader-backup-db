const cronJob = require("cron").job;
// Webscraping Imports
const MongoDump = require("./MongoDump");

MongoDump.exeMongodump();
cronJob(
    "1 */6 * * *",
    () => {
        MongoDump.exeMongodump();
    },
    null,
    true
);
