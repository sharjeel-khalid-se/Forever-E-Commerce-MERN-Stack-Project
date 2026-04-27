import React, { useContext, useState } from "react";
import Title from "../Components/Title";
import CartTotal from "../Components/CartTotal";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";

const PlaceOrders = () => {
  const [method, setMethod] = useState("cod");
  const {
    navigate,
    backendUrl,
    token,
    cartItems,
    setCartItems,
    getCartAmount,
    delivery_fee,
    products,
  } = useContext(ShopContext);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  const onChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;

    setFormData((data) => ({ ...data, [name]: value }));
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      let orderItems = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            const itemInfo = structuredClone(
              products.find((product) => product._id === items)
            );
            if (itemInfo) {
              itemInfo.size = item;
              itemInfo.quantity = cartItems[items][item];
              orderItems.push(itemInfo);
            }
          }
        }
      }

      if (orderItems.length === 0) {
        toast.error('Please add items to your cart');
        return;
      }

      let orderData = {
        address: formData,
        items: orderItems,
        amount: getCartAmount() + delivery_fee,
        paymentMethod: "COD",
        payment: false,
        status: "Order Placed",
      };

      console.log(orderData);

      switch (method) {
        // api call for cod
        case "cod":
          const response = await axios.post(
            backendUrl + "/api/orders/place",
            orderData,
            { headers: { token } }
          );

          if (response.data.success) {
            setCartItems({});
            navigate("/orders");
          } else {
            toast.error(response.data.message);
            console.log("error");
          }
          break;

        case "stripe":
          const responseStripe = await axios.post(
            backendUrl + "/api/orders/stripe",
            orderData,
            { headers: { token } }
          );
          if (responseStripe.data.success) {
            const { session_url } = responseStripe.data;
            window.location.replace(session_url);
          } else {
            toast.error(response.data.message);
            console.log("error");
          }

          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t"
    >
      {/* -------------Left side -------------- */}
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1={"DELIVERY"} text2={"INFORMATION"} />
        </div>

        <div className="flex gap-3">
          <input
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="First Name"
            onChange={onChangeHandler}
            name="firstName"
            value={formData.firstName}
            required
          />
          <input
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="Last Name"
            onChange={onChangeHandler}
            value={formData.lastName}
            name="lastName"
            required
          />
        </div>
        <input
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="email"
          placeholder="Email Address"
          onChange={onChangeHandler}
          value={formData.email}
          required
          name="email"
        />
        <input
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="text"
          placeholder="Street Address"
          onChange={onChangeHandler}
          value={formData.street}
          required
          name="street"
        />
        <div className="flex gap-3">
          <input
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="City"
            onChange={onChangeHandler}
            value={formData.city}
            name="city"
            required
          />
          <input
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="State"
            onChange={onChangeHandler}
            value={formData.state}
            name="state"
            required
          />
        </div>
        <div className="flex gap-3">
          <input
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="number"
            placeholder="Zip Code"
            onChange={onChangeHandler}
            value={formData.zipcode}
            name="zipcode"
            required
          />
          <input
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="Country"
            onChange={onChangeHandler}
            value={formData.country}
            name="country"
            required
          />
        </div>
        <input
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="number"
          placeholder="Phone"
          onChange={onChangeHandler}
          value={formData.phone}
          name="phone"
          required
        />
      </div>

      {/* -------------Right Side */}
      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal />
        </div>
        <div className="mt-12">
          <Title text1={"PAYMENT"} text2={"METHOD"} />
          {/* ------------Payment method selection */}
          <div className="flex gap-3 flex-col lg:flex-row">
            <div
              onClick={() => setMethod("stripe")}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "stripe" ? "bg-green-400" : ""
                }`}
              ></p>
              <img className="h-5 mx-4" src={assets.stripe_logo} alt="" />
            </div>
            <div
              onClick={() => setMethod("razorpay")}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "razorpay" ? "bg-green-400" : ""
                }`}
              ></p>
              <img className="h-5 mx-4" src={assets.razorpay_logo} alt="" />
            </div>
            <div
              onClick={() => setMethod("cod")}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "cod" ? "bg-green-400" : ""
                }`}
              ></p>
              <p className="text-gray-500 text-sm font-medium mx-4">
                CASH ON DELIVERY
              </p>
            </div>
          </div>
          <div className="w-full text-end mt-8">
            <button
              type="submit"
              className="bg-black text-white px-16 py-3 text-sm cursor-pointer"
            >
              PLACE ORDER
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrders;
