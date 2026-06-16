const { DateTime } = require("luxon");

function estToUTC(dateString) {
    return DateTime
        .fromISO(dateString, { zone: "America/New_York" })
        .toUTC()
        .toJSDate();
}

module.exports = { estToUTC };