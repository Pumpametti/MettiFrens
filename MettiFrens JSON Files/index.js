for (id = 1; id <= 100; id++) {
    const fs = require('fs');

    let fileName = `./${id}.json`;
    let file = require(fileName);
        
    file.image = `https://ipfs.io/ipfs/QmWNpVEDNgWpZjKvo1ozxC1KSDhLUXjbrfuKnxkwDa2us1/${id}.png`;
        
    fs.writeFile(fileName, JSON.stringify(file), function writeJSON(err) {
    if (err) return console.log(err);
    console.log(JSON.stringify(file));
    console.log('writing to ' + fileName);
    })}