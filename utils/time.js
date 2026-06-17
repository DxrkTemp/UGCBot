const { DateTime } = require("luxon");

function estToUTC(dateString) {
    const dt = DateTime.fromFormat(
        dateString,
        "yyyy-MM-dd HH:mm",
        { zone: "America/New_York" }
    );

    if (!dt.isValid) {
        return null;
    }

    return dt.toUTC().toJSDate();
}

module.exports = { estToUTC };
