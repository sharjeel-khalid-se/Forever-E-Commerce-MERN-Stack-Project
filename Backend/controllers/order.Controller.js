import orderModel from "../Models/order.Model.js";
import userModel from "../Models/user.model.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_KEY);

let currency = "usd";
let deliveryChargers = 10;

//  placing using OCD Method
const placeOrder = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const { items, address, amount } = req.body;
    console.log(items)

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "COD",
      payment: false,
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({ success: true, message: "Order Placed" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// place using stripe Method
const placeOrderStripe = async (req, res) => {
  try {
    const { origin } = req.headers;
    const { id: userId } = req.user;
    const { items, address, amount } = req.body;

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "stripe",
      payment: false,
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    const line_items = items.map((item) => ({
      price_data: {
        currency: currency,
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100, // Stripe accepts amount in cents
      },
      quantity: item.quantity,
    }));

    line_items.push({
      price_data: {
        currency: currency,
        product_data: {
          name: "Delivery fee",
        },
        unit_amount: deliveryChargers * 100,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
      line_items, 
      mode: "payment",
    });

    res.json({ success: true, session_url: session.url }); 
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyStripe = async(req, res)=>{
  try {
    const {success, orderId} = req.body
    const userId = req.user.id;
    if(success === 'true'){
      await orderModel.findByIdAndUpdate(orderId,{payment : true})
      await userModel.findByIdAndUpdate(userId, {cartData : {}})
      res.json({success : true})
    } else {
      await orderModel.findByIdAndDelete(orderId)
      res.json({success : false})
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}


// place using Razorpay Method
const placeOrderRazorpay = async (req, res) => {};

// All orders data for admin panle
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// user order data for frontend
const userOrder = async (req, res) => {
  try {
    const userId = req.user.id; // 🔥 Directly from the decoded token
    console.log("Fetching orders for:", userId);
    const orders = await orderModel.find({ userId });
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// update order status from admin panle
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    await orderModel.findByIdAndUpdate(orderId, { status });

    res.status(201).json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export {
  placeOrder,
  placeOrderStripe,
  placeOrderRazorpay,
  allOrders,
  userOrder,
  updateStatus,
  verifyStripe
};
