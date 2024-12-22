const fs = require('fs');

// Input and output file paths
const inputFile = './punionice.json';
const outputFile = './punionice-hrvatske.json';

// Keywords to filter by
const filterKeywords = ["Hrvatska", "Croatia", "HRV"];

// Function to check if the address contains any keyword
const containsKeyword = (address, keywords) => {
    return keywords.some(keyword => address.includes(keyword));
};

// Read, filter, and write the JSON data
fs.readFile(inputFile, 'utf8', (err, data) => {
    if (err) {
        console.error("Error reading input file:", err);
        return;
    }

    try {
        const jsonData = JSON.parse(data);

        // Filter data
        const filteredData = jsonData.filter(item => 
            containsKeyword(item.address, filterKeywords)
        );

        // Write filtered data to output file
        fs.writeFile(outputFile, JSON.stringify(filteredData, null, 2), 'utf8', err => {
            if (err) {
                console.error("Error writing output file:", err);
            } else {
                console.log(`Filtered data saved to ${outputFile}`);
            }
        });
    } catch (err) {
        console.error("Error parsing JSON data:", err);
    }
});
