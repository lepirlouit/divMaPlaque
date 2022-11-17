divService = require('./divService');

const plaqueInput = process.argv[2];
const plaque = plaqueInput.replace(/[\.,\-,\s]/g, '');


divService.getStatus(plaque).then(console.log);



