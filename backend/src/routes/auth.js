const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
// adiconando rotas
router.post("/signup", authController.signup);
router.post("/signin", authController.signin);

//router.post("/signin", authController.signin);

module.exports = router;
