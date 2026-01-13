const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const usersFile = path.join(__dirname, "../data/users.json");

const usersPath = path.join(__dirname, "../data/users.json");
console.log("Procurando users.json em:", usersPath);

// alteração para usersFile
const getUsers = () => JSON.parse(fs.readFileSync(usersFile, "utf-8"));

// Salvar usuários
const saveUsers = (users) => {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

// cadastrar usuarios
exports.signup = (req, res) => {
  const { name, email, password, state } = req.body;

  // 1. Validar dados
  if (!name || !email || !password || !state) {
    return res.json({ error: "Dados incompletos" });
  }

  // 2. Ler usuários existentes
  const users = getUsers();

  // 3. Verificar se email já existe
  const emailExists = users.find((u) => u.email === email);
  if (emailExists) {
    return res.json({ error: "E-mail já cadastrado" });
  }

  // 4. Criar novo usuário
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password,
    state,
  };

  // 5. Salvar no "banco"
  users.push(newUser);
  saveUsers(users);

  // 6. Retornar sucesso
  res.json({
    token: "token_fake_" + newUser.id,
    user: {
      id: newUser.id,
      email: newUser.email,
    },
  });
};

//

exports.signin = (req, res) => {
  const { email, password } = req.body;

  const users = getUsers();

  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.json({ error: "Usuário ou senha inválidos" });
  }

  res.json({
    token: "token_fake_" + user.id,
    user: {
      id: user.id,
      email: user.email,
    },
  });
};
