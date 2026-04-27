import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env'),
  override: true,
});

import connectDB from '../config/mongodb.js';
import cloudinary from '../config/cloudinary.js';
import productModel from '../Models/product.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');
const frontendAssetsFile = path.resolve(backendDir, '..', 'Frontend', 'src', 'assets', 'assets.js');

const source = await readFile(frontendAssetsFile, 'utf8');

const imageImports = {};
for (const match of source.matchAll(/^import\s+([A-Za-z0-9_$]+)\s+from\s+['"](.+?\.png)['"];?$/gm)) {
  const importName = match[1];
  const relativePath = match[2];
  imageImports[importName] = path.resolve(path.dirname(frontendAssetsFile), relativePath);
}

const productsStart = source.indexOf('export const products = [');

if (productsStart === -1) {
  throw new Error('Could not find the products array in Frontend/src/assets/assets.js');
}

const arrayStart = source.indexOf('[', productsStart);
let cursor = arrayStart + 1;
const productSourceBlocks = [];

while (cursor < source.length) {
  const openIndex = source.indexOf('{', cursor);
  if (openIndex === -1) {
    break;
  }

  let depth = 0;
  let endIndex = openIndex;

  for (; endIndex < source.length; endIndex += 1) {
    const character = source[endIndex];
    if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        break;
      }
    }
  }

  if (depth !== 0) {
    throw new Error('Failed to parse a product object from assets.js');
  }

  productSourceBlocks.push(source.slice(openIndex, endIndex + 1));
  cursor = endIndex + 1;
}

const importNames = Object.keys(imageImports);
const importValues = importNames.map((name) => imageImports[name]);

const parsedProducts = productSourceBlocks.map((productSource) => {
  const evaluateProduct = new Function(...importNames, `return (${productSource});`);
  return evaluateProduct(...importValues);
});

const uploadCache = new Map();

const uploadImage = async (imagePath) => {
  if (uploadCache.has(imagePath)) {
    return uploadCache.get(imagePath);
  }

  const uploadPromise = cloudinary.uploader.upload(imagePath, {
    folder: 'forever-products',
    resource_type: 'image',
  });

  uploadCache.set(imagePath, uploadPromise.then((result) => result.secure_url));
  return uploadCache.get(imagePath);
};

const buildSeedDocuments = async () => {
  const documents = [];

  for (const product of parsedProducts) {
    const imageUrls = [];

    for (const imagePath of product.image || []) {
      imageUrls.push(await uploadImage(imagePath));
    }

    documents.push({
      name: product.name,
      description: product.description,
      price: product.price,
      image: imageUrls,
      category: product.category,
      subCategory: product.subCategory,
      sizes: product.sizes,
      bestseller: Boolean(product.bestseller),
      date: product.date,
    });
  }

  return documents;
};

const run = async () => {
  try {
    await connectDB();

    const documents = await buildSeedDocuments();

    await productModel.deleteMany({});
    await productModel.insertMany(documents);

    console.log(`Seeded ${documents.length} products`);
    process.exit(0);
  } catch (error) {
    console.error('Product seed failed:');
    console.error(error);
    process.exit(1);
  }
};

await run();