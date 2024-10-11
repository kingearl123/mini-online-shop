const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const ModelsUser = require("./models/ModelsUser");
const ModelsProduct = require("./models/ModelsProduct");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");

const app = express();
const PORT = 8000;

app.use(express.json());
app.use(cors());

// Koneksi ke MongoDB Atlas
const uri =
  "mongodb+srv://my-project:12345@cluster0.paj90wj.mongodb.net/online-shop?retryWrites=true&w=majority&appName=Cluster0";
mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Menghasilkan kunci rahasia JWT
const JWT_SECRET_KEY = crypto.randomBytes(64).toString("hex");
console.log("JWT Secret Key:", JWT_SECRET_KEY);

// Middleware untuk autentikasi
const authenticate = async (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    console.log("Token not provided");
    return res.status(401).send("Access Denied");
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET_KEY);
    req.user = verified;
    next();
  } catch (err) {
    console.log("Token verification failed:", err.message);
    res.status(400).send("Invalid Token");
  }
};

// Rute untuk produk
app.get("/api/products/uploads/", async (req, res) => {
  try {
    const products = await ModelsProduct.find({});
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Server Error");
  }
});

// Rute untuk login admin
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    console.log("Username or password not provided");
    return res.status(400).send("Username and password are required");
  }

  const user = await ModelsUser.findOne({ username });
  if (!user) {
    console.log("User not found");
    return res.status(400).send("Invalid username or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    console.log("Password mismatch");
    return res.status(400).send("Invalid username or password");
  }

  const token = jwt.sign({ _id: user._id }, JWT_SECRET_KEY);
  res.json({ role: user.role, token });
});

app.post("/api/register", async (req, res) => {
  const { username, password, role } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new ModelsUser({ username, password: hashedPassword, role });
  await user.save();
  res.send("User registered");
});

// Rute untuk mendapatkan semua pengguna
app.get("/api/users", async (req, res) => {
  try {
    const users = await ModelsUser.find({});
    res.json(users);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

// Rute untuk checkout menggunakan Midtrans
const makeRequestWithRetry = async (req, attempts = 3) => {
  try {
    console.log("Making request to Midtrans...");
    const { cart, total } = req.body;

    if (!cart || !total) {
      throw new Error("Cart and total are required");
    }

    for (const item of cart) {
      if (!item._id || !item.price || !item.quantity || !item.name) {
        throw new Error(
          "Each item in cart must have _id, price, quantity, and name"
        );
      }
    }

    const orderId = `order-${Date.now()}`;

    const midtransResponse = await axios.post(
      "https://app.midtrans.com/snap/v1/transactions",
      {
        transaction_details: {
          gross_amount: total,
          order_id: orderId,
        },
        item_details: cart.map((item) => ({
          id: item._id,
          price: item.price,
          quantity: item.quantity,
          name: item.name,
        })),
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            "Mid-server-vSl-Q_y6UUZ8cHFLtCOiXoo1"
          ).toString("base64")}`,
        },
      }
    );

    console.log("Midtrans response:", midtransResponse.data);
    return midtransResponse.data;
  } catch (error) {
    console.error("Error during checkout:", error);
    if (error.response && error.response.status === 503 && attempts > 0) {
      console.log(
        `Server is unavailable, retrying in 5 seconds... Attempts left: ${attempts}`
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return makeRequestWithRetry(req, attempts - 1);
    } else {
      throw error;
    }
  }
};

app.post("/checkout", async (req, res) => {
  try {
    console.log("Checkout request received");
    const midtransResponse = await makeRequestWithRetry(req);
    res.json(midtransResponse);
  } catch (error) {
    console.error("Checkout failed:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
});

// Mengatur multer untuk mengunggah file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// Rute untuk mengunggah produk
app.post("/api/products", upload.single("image"), async (req, res) => {
  try {
    if (!req.body.name || !req.body.price || !req.body.description) {
      return res
        .status(400)
        .send("Nama, harga, dan deskripsi produk diperlukan.");
    }

    const product = new ModelsProduct({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      image: req.file.path,
    });

    await product.save();
    res.status(201).send(product);
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).send("Server Error");
  }
});

// Mendapatkan detail produk berdasarkan ID
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await ModelsProduct.findById(req.params.id);
    if (!product) {
      return res.status(404).send("Product not found");
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).send("Server Error");
  }
});

// Memperbarui produk
app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description } = req.body;

    const product = await ModelsProduct.findById(id);
    if (!product) {
      return res.status(404).send("Product not found");
    }

    product.name = name;
    product.price = price;
    product.description = description;
    if (req.file) {
      product.image = req.file.path;
    }

    await product.save();
    res.status(200).send(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Server Error");
  }
});

// Menghapus produk
app.delete("/api/products/:id", async (req, res) => {
  try {
    const product = await ModelsProduct.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).send("Product not found");
    }
    res.send({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send("Server error");
  }
});

app.use("/uploads", express.static("uploads"));

// Rute default
app.get("/", (req, res) => {
  res.send("Welcome to the Online Shop API!");
});

// Mulai server
app.listen(PORT, () =>
  console.log(`Server running on port http://localhost:${PORT}`)
);