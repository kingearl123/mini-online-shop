import React, { createContext, useState } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item._id === product._id
      );
      let updatedCart;
      if (existingItemIndex >= 0) {
        const updatedItem = {
          ...prevCart[existingItemIndex],
          quantity: prevCart[existingItemIndex].quantity + 1,
        };
        updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = updatedItem;
      } else {
        updatedCart = [...prevCart, { ...product, quantity: 1 }];
      }
      return updatedCart;
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter((item) => item._id !== productId);
      return updatedCart;
    });
  };

  const updateQuantity = (productId, quantity) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) => {
        if (item._id === productId) {
          return { ...item, quantity };
        }
        return item;
      });
      return updatedCart;
    });
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity }}
    >
      {children}{" "}
    </CartContext.Provider>
  );
};
