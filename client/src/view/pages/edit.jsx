import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const Edit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: "",
    price: "",
    description: "",
    image: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:8000/api/products/${id}`
        );
        setProduct(response.data);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Failed to fetch product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    if (e.target.name === "image") {
      setProduct({ ...product, [e.target.name]: e.target.files[0] });
    } else {
      setProduct({ ...product, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("name", product.name);
    formData.append("price", product.price);
    formData.append("description", product.description);
    if (product.image) {
      formData.append("image", product.image);
    }

    try {
      await axios.put(`http://localhost:8000/api/products/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      navigate("/show"); // Redirect to the main page or wherever you want after updating
    } catch (error) {
      console.error("Error updating product:", error);
      setError("Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container pt-5">
      <h1 className="text-center">Perbarui Produk</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div>Loading...</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nama</label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={product.name}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="price">Harga</label>
          <input
            type="number"
            className="form-control"
            id="price"
            name="price"
            value={product.price}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Deskripsi</label>
          <textarea
            className="form-control"
            id="description"
            name="description"
            value={product.description}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="image">Gambar</label>
          <input
            type="file"
            className="form-control-file"
            id="image"
            name="image"
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Perbarui Produk
        </button>
      </form>
    </div>
  );
};

export default Edit;
