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

// **Serving static files for uploads folder**
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// **Connect to MongoDB Atlas**
const uri =
  "mongodb+srv://my-project:12345@cluster0.paj90wj.mongodb.net/online-shop?retryWrites=true&w=majority&appName=Cluster0";
mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// **Generate JWT Secret Key**
const JWT_SECRET_KEY = crypto.randomBytes(64).toString("hex");
console.log("JWT Secret Key:", JWT_SECRET_KEY);

// **Authentication Middleware**
const authenticate = async (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).send("Access Denied");

  try {
    const verified = jwt.verify(token, JWT_SECRET_KEY);
    req.user = verified;
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    res.status(400).send("Invalid Token");
  }
};

// **Multer Storage Configuration**
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage });

// **API: Register User**
app.post("/api/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new ModelsUser({ username, password: hashedPassword, role });
    await user.save();
    res.status(201).send("User registered successfully");
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).send("Registration failed");
  }
});

// **API: Login User**
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await ModelsUser.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).send("Invalid username or password");
    }

    const role = user.role;
    const token = jwt.sign({ _id: user._id }, JWT_SECRET_KEY);
    res.json({ role, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Login failed");
  }
});

// **API: Create Product with Image Upload**
app.post("/api/products", upload.single("image"), async (req, res) => {
  try {
    const { name, price, description } = req.body;

    if (!name || !price || !description || !req.file) {
      return res
        .status(400)
        .send("Name, price, description, and image are required");
    }

    const product = new ModelsProduct({
      name,
      price,
      description,
      image: `/uploads/${req.file.filename}`,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).send("Failed to save product");
  }
});

// **API: Get All Products**
app.get("/api/products", async (req, res) => {
  try {
    const products = await ModelsProduct.find({});
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Server error");
  }
});

// **API: Get Product by ID**
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await ModelsProduct.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).send("Server error");
  }
});

// **API: Update Product**
app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, price, description } = req.body;
    const product = await ModelsProduct.findById(req.params.id);

    if (!product) return res.status(404).send("Product not found");

    product.name = name || product.name;
    product.price = price || product.price;
    product.description = description || product.description;
    if (req.file) product.image = `/uploads/${req.file.filename}`;

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Failed to update product");
  }
});

// **API: Delete Product**
app.delete("/api/products/:id", async (req, res) => {
  try {
    const product = await ModelsProduct.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).send("Product not found");
    res.send({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send("Server error");
  }
});

// **API: Checkout with Midtrans**
const makeRequestWithRetry = async (req, attempts = 3) => {
  try {
    const { cart, total } = req.body;

    if (!cart || !total) throw new Error("Cart and total are required");

    const orderId = `order-${Date.now()}`;

    const response = await axios.post(
      "https://app.midtrans.com/snap/v1/transactions",
      {
        transaction_details: { order_id: orderId, gross_amount: total },
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

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 503 && attempts > 0) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return makeRequestWithRetry(req, attempts - 1);
    }
    throw error;
  }
};

app.post("/checkout", async (req, res) => {
  try {
    const midtransResponse = await makeRequestWithRetry(req);
    res.json(midtransResponse);
  } catch (error) {
    console.error("Checkout failed:", error);
    res.status(500).send("Failed to process payment");
  }
});

// **Start Server**
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);