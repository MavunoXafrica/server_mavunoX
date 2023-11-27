// Function to calculate the difference between two dates
const dateDifference = (timestamp1, timestamp2) => {
    // calculate the difference
    const differenceInMilliseconds = timestamp1 - timestamp2;

    // Convert the difference to days and return it
    return differenceInMilliseconds / (1000 * 60 * 60 * 24);  
}
module.exports = dateDifference;