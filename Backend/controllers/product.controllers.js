import productModel from '../Models/product.model.js';
import connectDB from '../config/mongodb.js';
// add product
const addProduct = async (req, res) => {
  try {
    await connectDB();

    const {
      name,
      price,
      description,
      category,
      subCategory,
      sizes,
      bestseller,
    } = req.body;

    // Handle image uploads from fields
    const files = req.files || {};
    const imageFields = ['image1', 'image2', 'image3', 'image4'];

    const imageUrls = imageFields
      .flatMap((field) => files[field] || [])
      .map((file) => file.path || file.secure_url || file.filename)
      .filter(Boolean);

    if (imageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product image is required',
      });
    }

    let parsedSizes = [];
    try {
      parsedSizes = sizes ? JSON.parse(sizes) : [];
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Sizes must be a valid JSON array',
      });
    }

    const productData = {
      name,
      description,
      price: Number(price),
      sizes: parsedSizes,
      category,
      subCategory,
      bestseller: bestseller === 'true',
      image: imageUrls,
      date: Date.now(),
    };

    const product = new productModel(productData);
    await product.save();

    res.status(200).json({ success: true, message: 'Product Added' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// removing product
const removeProduct = async (req, res) => {
  try {
    await connectDB();

    const id = req.body.id;
    await productModel.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Product Deleted' });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// list all product
const listProduct = async (req, res) => {
  try {
    await connectDB(); // 🧙‍♂️ Must connect before querying

    const products = await productModel.find({});
    res.json({ success: true, products });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


// for single product info
const singleProduct = async (req, res) => {
  try {
    await connectDB();

    const { productId } = req.body;
    const product = await productModel.findById(productId);
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export { addProduct, listProduct, removeProduct, singleProduct };
