import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { CartContext } from "../CartContext";
import Navbar from "./components/Navbar";
import Header from "./components/Header";
import Footer from "./components/Footer";

const Homepage = () => {
  const { cartCount, addToCart } = useContext(CartContext);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/products/uploads/"
        );
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  // Fungsi untuk mengkonversi harga menjadi format Rupiah
  const formatRupiah = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div>
      <Navbar cartCount={cartCount} />
      <Header />
      <section className="py-5">
        <div className="container px-4 px-lg-5 mt-5">
          <h1 className="text-center">List Product</h1>
          <div className="row gx-4 gx-lg-5 row-cols-2 row-cols-md-3 row-cols-xl-4 justify-content-center">
            {products.map((product) => (
              <div className="col mb-5" key={product._id}>
                <div className="card h-100">
                  <img
                    src={`http://localhost:8000/${product.image}`}
                    alt={product.name}
                    style={{ width: "100%", height: "auto" }}
                    className="card-img-top"
                  />
                  <div className="card-body p-4">
                    <h5 className="card-title fw-bold text-center">
                      {product.name}
                    </h5>
                    <p className="card-text text-center">
                      {formatRupiah(product.price)}
                    </p>
                  </div>
                  <div className="card-footer p-4 pt-0 border-top-0 bg-transparent">
                    <div className="text-center">
                      <button
                        className="btn btn-outline-dark mt-auto"
                        onClick={() => addToCart(product)}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Homepage;
