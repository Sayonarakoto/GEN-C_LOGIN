const getISTTimeInMinutes = (date) => {
    // Create a new Date object to avoid modifying the original
    const istDate = new Date(date);

    // Set the time zone to IST (UTC+5:30)
    // This is a common way to handle timezones in Node.js without heavy libraries
    // For more robust timezone handling, consider 'moment-timezone' or 'date-fns-tz'
    const utc = istDate.getTime() + (istDate.getTimezoneOffset() * 60000);
    const istOffset = 330; // IST is UTC+5:30, which is 330 minutes
    const newDate = new Date(utc + (istOffset * 60000));

    const hours = newDate.getHours();
    const minutes = newDate.getMinutes();

    return hours * 60 + minutes;
};

module.exports = {
    getISTTimeInMinutes,
};
