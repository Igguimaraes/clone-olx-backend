const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { error } = require("console");

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "..", "..", "uploads"));
    },

    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    },
  }),
});

const adsFile = path.join(__dirname, "..", "data", "ads.json");
const usersFile = path.join(__dirname, "..", "data", "users.json");

/* =========================
   LISTAGEM DE ANÚNCIOS
   ========================= */
router.get("/ad/list", (req, res) => {
  try {
    let ads = JSON.parse(fs.readFileSync(adsFile));
    const users = JSON.parse(fs.readFileSync(usersFile));

    const {
      q = "",
      state = "",
      cat = "",
      sort = "desc",
      limit = 9,
      page = 1,
    } = req.query;

    /* =========================
       FILTRO POR TEXTO
       ========================= */
    if (q) {
      ads = ads.filter(
        (ad) =>
          ad.title.toLowerCase().includes(q.toLowerCase()) ||
          (ad.description &&
            ad.description.toLowerCase().includes(q.toLowerCase()))
      );
    }

    /* =========================
       FILTRO POR CATEGORIA
       ========================= */
    if (cat) {
      ads = ads.filter((ad) => ad.category === cat);
    }

    /* =========================
       FILTRO POR ESTADO (USUÁRIO)
       ========================= */
    if (state) {
      ads = ads.filter((ad) => {
        const user = users.find((u) => u.id === ad.userId);
        return user && user.state === state;
      });
    }

    /* =========================
       ORDENAÇÃO
       ========================= */
    if (sort === "desc") {
      ads = ads.reverse();
    }

    const total = ads.length;
    const pageCount = Math.ceil(total / limit);

    /* =========================
       PAGINAÇÃO
       ========================= */
    const offset = (page - 1) * limit;
    ads = ads.slice(offset, offset + Number(limit));

    return res.json({
      total,
      page,
      pageCount,
      ads,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao listar anúncios" });
  }
});

/* =========================
   DETALHE DO ANÚNCIO
   ========================= */
router.get("/ad/item", (req, res) => {
  const { id, other } = req.query;

  try {
    // 🔹 Lê anúncios
    const ads = JSON.parse(fs.readFileSync(adsFile));
    const adIndex = ads.findIndex((item) => item.id == id);

    if (adIndex === -1) {
      return res.status(404).json({ error: "Anúncio não encontrado" });
    }

    // 🔹 Incrementa visualizações
    ads[adIndex].views = ads[adIndex].views ? ads[adIndex].views + 1 : 1;
    fs.writeFileSync(adsFile, JSON.stringify(ads, null, 2));

    // 🔹 Anúncio base
    const ad = ads[adIndex];

    // 🔹 Lê usuários
    const users = JSON.parse(fs.readFileSync(usersFile));
    const user = users.find((u) => u.id === ad.userId);

    // 🔹 ESTADO DO ANÚNCIO
    // Sempre vem do usuário dono do anúncio
    const adState = user?.state || null;

    // 🔹 Outros anúncios do mesmo vendedor
    const otherAds = ads.filter(
      (item) => item.userId === ad.userId && item.id !== ad.id
    );

    // 🔹 Quando other=true → retorna anúncio enriquecido
    if (other === "true") {
      const safeUser = user
        ? {
            id: user.id,
            name: user.name,
            phone: user.phone,
            avatar: user.avatar,
            state: user.state,
          }
        : null;

      return res.json({
        ...ad,

        // ✅ ESTADO DO ANÚNCIO (NOVO)
        state: adState,

        userInfo: safeUser,
        other: otherAds,
      });
    }

    // 🔹 Comportamento antigo (mantido)
    return res.json({
      ...ad,

      // ✅ ESTADO DO ANÚNCIO (NOVO)
      state: adState,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao carregar anúncio" });
  }
});

/* =========================
   DETALHE DO ANÚNCIO ROTAS DO VENDEDOR
   ========================= 
router.get("/ad/item", (req, res) => {
  const { id, other } = req.query;

  try {
    const ads = JSON.parse(fs.readFileSync(adsFile));
    const adIndex = ads.findIndex((item) => item.id == id);

    if (adIndex === -1) {
      return res.status(404).json({ error: "Anúncio não encontrado" });
    }

    // incrementa views
    ads[adIndex].views = ads[adIndex].views ? ads[adIndex].views + 1 : 1;
    fs.writeFileSync(adsFile, JSON.stringify(ads, null, 2));

    const ad = ads[adIndex];

    // 🔹 quando other=true, retorna dados extras
    if (other === "true") {
      const users = JSON.parse(fs.readFileSync(usersFile));
      const user = users.find((u) => u.id === ad.userId);

      // 🔹 outros anúncios do mesmo vendedor
      const otherAds = ads.filter(
        (item) => item.userId === ad.userId && item.id !== ad.id
      );

      return res.json({
        ...ad,
        userInfo: user || null,
        other: otherAds,
      });
    }

    // 🔹 comportamento antigo (continua funcionando)
    return res.json(ad);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao carregar anúncio" });
  }
});  */

/* =========================
   ADICIONAR ANÚNCIO
   ========================= */
router.post("/ad/add", upload.array("img"), (req, res) => {
  try {
    const ads = JSON.parse(fs.readFileSync(adsFile));

    const { title, price, priceng, desc, cat } = req.body;

    console.log("REQ.BODY:", req.body);
    console.log("PRICE RAW:", req.body.price);
    console.log("PRICE TYPE:", typeof req.body.price);

    // converte checkbox corretamente
    const priceNegotiable = priceng === "true";

    if (!title || (!price && !priceNegotiable)) {
      return res.status(400).json({
        error: "Título e preço são obrigatórios",
      });
    }

    const numericPrice = Number(price);

    if (!priceNegotiable && (isNaN(numericPrice) || numericPrice <= 0)) {
      return res.status(400).json({
        error: "Preço inválido",
      });
    }

    const priceObject = {
      value: priceNegotiable ? null : numericPrice,
      priceNegotiable,
    };

    const images = req.files
      ? req.files.map((file) => `http://localhost:501/uploads/${file.filename}`)
      : [];

    const newAd = {
      id: Date.now(),
      title,
      price: priceObject,
      userId: 1, // temporário
      images,
      category: cat,
      description: desc || "",
      createdAt: new Date().toISOString(),
      views: 0,
    };

    ads.push(newAd);
    fs.writeFileSync(adsFile, JSON.stringify(ads, null, 2));

    return res.json({ id: newAd.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erro ao adicionar anúncio",
    });
  }
});

/* =========================
   FILTRO DE ANÚNCIOS POR ESTADO
   ========================= */
router.get("/ads/by-state", (req, res) => {
  try {
    const { state } = req.query;

    // 🔹 validação básica
    if (!state) {
      return res.status(400).json({
        error: "Estado não informado",
      });
    }

    // 🔹 lê anúncios e usuários
    const ads = JSON.parse(fs.readFileSync(adsFile));
    const users = JSON.parse(fs.readFileSync(usersFile));

    // 🔹 filtra anúncios pelo estado do usuário
    const filteredAds = ads.filter((ad) => {
      const user = users.find((u) => u.id === ad.userId);
      return user && user.state === state;
    });

    return res.json({
      state,
      total: filteredAds.length,
      ads: filteredAds,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erro ao filtrar anúncios por estado",
    });
  }
});

/* =========================
  /ads (GARANTIA DE COMPATIBILIDADE
   ========================= */
router.get("/ads", (req, res) => {
  const { q, state, cat } = req.query;

  let ads = JSON.parse(fs.readFileSync(adsFile));

  if (state) {
    ads = ads.filter((ad) => ad.state === state);
  }

  if (cat) {
    ads = ads.filter((ad) => ad.category === cat || ad.category?.slug === cat);
  }

  if (q) {
    ads = ads.filter((ad) => ad.title.toLowerCase().includes(q.toLowerCase()));
  }

  res.json({
    ads,
    total: ads.length,
  });
});

/* =========================
  / Minha Conta
   ========================= */
router.get("/user/me", (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ notallowed: true });
    }

    const token = authHeader.split(" ")[1];

    const users = JSON.parse(fs.readFileSync(usersFile));
    const ads = JSON.parse(fs.readFileSync(adsFile));

    const user = users.find((u) => u.token === token);

    console.log("TOKEN RECEBIDO:", token);
    console.log(
      "TOKENS NO BANCO:",
      users.map((u) => u.token)
    );

    if (!user) {
      return res.status(401).json({ notallowed: true });
    }

    const userAds = ads.filter((ad) => ad.userId === user.id);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        state: user.state,
        avatar: user.avatar,
      },
      ads: userAds,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao carregar conta" });
  }
});

/* =========================
  / User Signin
   ========================= */
router.post("/user/signin", (req, res) => {
  try {
    const { email, password } = req.body;

    const users = JSON.parse(fs.readFileSync(usersFile));

    const userIndex = users.findIndex(
      (u) => u.email === email && u.password === password
    );

    if (userIndex === -1) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    // 🔐 GERA TOKEN REAL
    const token = "token_" + Date.now();

    // 🔐 SALVA TOKEN NO USUÁRIO
    users[userIndex].token = token;

    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    return res.json({
      token,
      user: {
        id: users[userIndex].id,
        name: users[userIndex].name,
        email: users[userIndex].email,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro no login" });
  }
});

module.exports = router;
