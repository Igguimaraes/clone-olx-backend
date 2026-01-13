const fs = require("fs");
const path = require("path");

const getCategories = () => {
  const filePath = path.join(__dirname, "../data/categories.json");
  const data = fs.readFileSync(filePath);
  return JSON.parse(data);
};

exports.list = (req, res) => {
  const categories = getCategories();
  res.json({ categories });
};
