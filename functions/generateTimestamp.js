// function extract individual dates froma date string and generate timestamp
const generateTimestamp = (date_string) => {
    // Split the date string into an array of words
    const date_array = date_string.split(' ');
  

    // Extract day, month, and year
    const day = parseInt(date_array[0], 10); // Convert to number
    let month;
    const year = parseInt(date_array[2], 10); // Convert to number

    if (date_array[1] === "January") {
        month = 0;
    } else if (date_array[1] === "February") {
        month = 1;
    } else if (date_array[1] === "March") {
        month = 2;
    } else if (date_array[1] === "April") {
        month = 3;
    } else if (date_array[1] === "May") {
        month = 4;
    } else if (date_array[1] === "June") {
        month = 5;
    } else if (date_array[1] === "July") {
        month = 6;
    } else if (date_array[1] === "August") {
        month = 7;
    } else if (date_array[1] === "September") {
        month = 8;
    } else if (date_array[1] === "October") {
        month = 9;
    } else if (date_array[1] === "November") {
        month = 10;
    } else if (date_array[1] === "December") {
        month = 11;
    }

  
    // generate timestamp and return timestamp
    const date = new Date(year, month, day);
    return date.getTime();
}

module.exports = generateTimestamp;