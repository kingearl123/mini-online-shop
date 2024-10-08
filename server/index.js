const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const ModelsUser = require("./models/ModelsUser");
const ModelsProduct = require("./models/ModelsProduct");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // Mengimpor modul crypto
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

  // Make sure username and password are provided
  if (!username || !password) {
    console.log("Username or password not provided");
    return res.status(400).send("Username and password are required");
  }

  // Find user in the database
  const user = await ModelsUser.findOne({ username });
  if (!user) {
    console.log("User not found");
    return res.status(400).send("Invalid username or password");
  }

  // Check the role of the user
  let role;
  if (user.role === "admin") {
    role = "admin";
  } else {
    role = "customer";
  }

  // If everything is correct, create token and send as response
  const token = jwt.sign({ _id: user._id }, JWT_SECRET_KEY); // Gunakan JWT_SECRET_KEY

  // Send the role as part of the response
  res.json({ role, token }); // Kirim token sebagai bagian dari respons
});

app.post("/api/register", async (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10); // Hash password
  const user = new ModelsUser({ username, password: hashedPassword, role });
  await user.save();
  res.send("User registered");
});

// Rute untuk user (admin dan customer)
app.get("/api/users", async (req, res) => {
  try {
    const users = await ModelsUser.find({});
    res.json(users);
  } catch (error) {
    res.status(500).send("server error");
  }
});

// Rute untuk checkout
// Fungsi untuk mencoba permintaan lagi jika mendapatkan status 503
const makeRequestWithRetry = async (req, attempts = 3) => {
  try {
    console.log("Making request to Midtrans...");
    const { cart, total } = req.body;

    // Validasi cart dan total
    if (!cart || !total) {
      throw new Error("Cart and total are required");
    }

    // Validasi setiap item dalam cart
    for (const item of cart) {
      if (!item._id || !item.price || !item.quantity || !item.name) {
        throw new Error(
          "Each item in cart must have _id, price, quantity, and name"
        );
      }
    }

    // Generate a unique order ID
    const orderId = `order-${Date.now()}`;

    const midtransResponse = await axios.post(
      "https://app.midtrans.com/snap/v1/transactions",
      {
        transaction_details: {
          gross_amount: total, // Pastikan ini adalah angka
          order_id: orderId, // ID pesanan unik
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

// Rute untuk checkout
// Rute untuk checkout
app.post("/checkout", async (req, res) => {
  try {
    console.log("Checkout request received");
    const midtransResponse = await makeRequestWithRetry(req);
    console.log("Midtrans response:", midtransResponse);
    // Kirim respons Midtrans kembali ke klien
    res.json(midtransResponse);
  } catch (error) {
    console.error("Checkout failed:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
});

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

// Rute untuk mengunggah gambar produk
app.post("/api/products", upload.single("image"), async (req, res) => {
  try {
    // Validasi input
    if (!req.body.name || !req.body.price || !req.body.description) {
      return res
        .status(400)
        .send("Nama, harga, dan deskripsi produk diperlukan.");
    }

    // Create a new product object
    const product = new ModelsProduct({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      image: req.file.path, // Save the path to the image
    });

    // Save the product to the database
    await product.save();

    res.status(201).send(product);
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).send("Server Error");
  }
});

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

// Rute untuk memperbarui produk
app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description } = req.body;

    // Cari produk berdasarkan ID
    const product = await ModelsProduct.findById(id);
    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Perbarui detail produk
    product.name = name;
    product.price = price;
    product.description = description;
    if (req.file) {
      product.image = req.file.path; // Update the image path if a new file is uploaded
    }

    // Simpan perubahan ke database
    await product.save();

    res.status(200).send(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Server Error");
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    // Use the correct model name for deleting the product
    const product = await ModelsProduct.findByIdAndDelete(req.params.id);
    if (!product) {
      // If the product is not found, send a 404 status code
      return res.status(404).send("Product not found");
    }
    // If the product is successfully deleted, send a success message
    res.send({ message: "Product deleted successfully" });
  } catch (error) {
    // If there's an error, log it and send a 500 status code
    console.error("Error deleting product:", error);
    res.status(500).send("Server error");
  }
});

app.use("/uploads", express.static("uploads"));

// Mulai server
app.listen(PORT, () =>
  console.log(`Server running on port http://localhost:${PORT}`)
);
