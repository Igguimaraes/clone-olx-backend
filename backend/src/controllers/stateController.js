const fs = require("fs");
const path = require("path");

const statesFile = path.join(__dirname, "../data/states.json");

const getStates = () => {
  const data = fs.readFileSync(statesFile);
  return JSON.parse(data);
};

// LISTAR ESTADOS
exports.list = (req, res) => {
  const states = getStates();
  res.json({ states });
};
