import React, { useState, useEffect } from "react";
import axios from "axios";

// Product Card Component
const Product = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/products/uploads/"
        );
        console.log(response.data); // Log the response
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <>
      {products.map((product) => (
        <div className="col mb-5" key={product._id}>
          <div className="card h-100">
            {/* Your original product card code goes here */}
            <img
              src={`http://localhost:8000/${product.image}`}
              alt={product.name}
              style={{ width: "50px", height: "auto" }}
            />
            <div className="card-body p-4">
              <div className="text-center">
                <h5 className="fw-bolder">{product.name}</h5>
                {product.price}$
              </div>
            </div>
            <div className="card-footer p-4 pt-0 border-top-0 bg-transparent">
              <div className="text-center">
                <a className="btn btn-outline-dark mt-auto" href="#!">
                  Add to Chart
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default Product;
