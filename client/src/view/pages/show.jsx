import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Navbar from "./NavbarDashboard";
import { Link } from "react-router-dom";
import axios from "axios";

const Show = () => {
  const [products, setProducts] = useState([]);

  const deleteProduct = async (id) => {
    try {
      await axios.delete(
        `https://mini-online-shop-1.vercel.app/api/products/${id}`
      );
      setProducts(products.filter((product) => product._id !== id));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const formatRupiah = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "https://mini-online-shop-1.vercel.app/api/products/uploads/"
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
      <Navbar />
      <div className="container pt-5">
        <h1 className="text-center">Data Product</h1>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Description</th>
              <th>Image</th>
              <th className="text-center" colSpan={2}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>{formatRupiah(product.price)}</td> {/* Perbaikan disini */}
                <td>{product.description}</td>
                <td className="img-preview">
                  {product.image ? (
                    <img
                      src={`https://mini-online-shop-1.vercel.app/${product.image}`}
                      alt={product.name}
                      style={{ width: "50px", height: "auto" }}
                    />
                  ) : (
                    <p className="image-text">
                      Image Preview <br /> Suggested Size 300x300
                    </p>
                  )}
                </td>
                <td>
                  <Link to={`/edit/${product._id}`} className="btn btn-warning">
                    Edit
                  </Link>
                </td>
                <td>
                  <button
                    className="btn btn-danger"
                    onClick={() => deleteProduct(product._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Link to="/input" className="btn btn-success">
          Tambah Data
        </Link>
      </div>
    </>
  );
};

export default Show;
