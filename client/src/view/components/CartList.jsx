import React, { useContext } from "react";
import axios from "axios";
import { CartContext } from "../../CartContext";

const CartList = () => {
  const { cart, removeFromCart, updateQuantity } = useContext(CartContext);

  // Fungsi untuk menghitung total harga
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Fungsi untuk mengkonversi harga menjadi format Rupiah
  const formatRupiah = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Fungsi checkout
  const checkout = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/checkout",
        {
          cart: cart,
          total: calculateTotal(),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          },
        }
      );

      // Redirect pengguna ke halaman pembayaran Midtrans
      window.location.href = response.data.redirect_url;

      // Simpan token untuk verifikasi
      localStorage.setItem("midtransToken", response.data.token);
    } catch (error) {
      console.error("Error during checkout:", error);
      alert("Checkout failed. Please try again later.");
    }
  };

  const handleChange = (productId, event) => {
    const quantity = parseInt(event.target.value, 10);
    if (quantity > 0) {
      // Gunakan productId sebagai parameter untuk updateQuantity
      updateQuantity(productId, quantity);
    } else {
      // Gunakan productId sebagai parameter untuk removeFromCart
      removeFromCart(productId);
    }
  };

  if (!cart || cart.length === 0) {
    return <div className="text-center">Cart is empty.</div>;
  }

  return (
    <div className="container mt-5">
      <h2 className="text-center">Cart Items</h2>
      <div className="row">
        {cart.map((item, index) => (
          <div className="col-md-4 mb-4" key={index}>
            <div className="card">
              <img
                src={`http://localhost:8000/${item.image}`}
                className="card-img-top"
                alt={item.name}
              />
              <div className="card-body">
                <h5 className="card-title">{item.name}</h5>
                <p className="card-text">Price: {formatRupiah(item.price)}</p>
                <div className="input-group mb-3">
                  <input
                    type="number"
                    className="form-control"
                    value={item.quantity || 1}
                    onChange={(event) => handleChange(item._id, event)} // Perbarui di sini
                  />
                  <button
                    className="btn btn-danger"
                    onClick={() => removeFromCart(item._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-4">
        <h4>Total: {formatRupiah(calculateTotal())}</h4>
      </div>
      <div className="text-center mt-4">
        <button className="btn btn-success" onClick={checkout}>
          Checkout
        </button>
      </div>
    </div>
  );
};

export default CartList;
