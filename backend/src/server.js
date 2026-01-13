//import path from "path";
const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");

const app = express();

app.use(
  cors({
    origin: "https://seusite.netlify.app",
  })
);

app.use(express.json());

//middleware
app.use(express.urlencoded({ extended: true }));

app.use("/user", authRoutes);
//estados
const stateRoutes = require("./routes/stateRoutes");

app.use(stateRoutes);
// categorias
const categoryRoutes = require("./routes/categories");

app.use(categoryRoutes);

//importação de imagens
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

//importação de lista de anúncios recentes
const adRoutes = require("./routes/ad");
app.use(adRoutes);

app.post("/user/signup", (req, res) => {
  const { name, email, password, state } = req.body;

  if (!name || !email || !password || !state) {
    return res.status(400).json({
      error: "Dados incompletos",
    });
  }

  // simulação de cadastro
  res.json({
    token: "token_fake_123",
  });
});

//upload de imagens

app.use("/uploads", express.static("uploads"));

app.listen(501, () => {
  console.log("Backend rodando em http://localhost:501");
});
