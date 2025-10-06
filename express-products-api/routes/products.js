const express = require('express');
const { v4: uuidv4 } = require('uuid');
const loggerMiddleware = require('../middleware/logger');
const authMiddleware = require('../middleware/auth');
const { validateProduct, validateProductUpdate } = require('../middleware/validation');
const { NotFoundError } = require('../utils/errors');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// In-memory storage (replace with database in production)
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop for developers',
    price: 1299.99,
    category: 'Electronics',
    inStock: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Coffee Mug',
    description: 'Ceramic coffee mug with handle',
    price: 12.99,
    category: 'Kitchen',
    inStock: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Desk Lamp',
    description: 'LED desk lamp with adjustable brightness',
    price: 34.99,
    category: 'Home',
    inStock: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Apply middleware to all routes
router.use(loggerMiddleware);
router.use(authMiddleware);

// GET /api/products - List all products with filtering, pagination, and search
router.get('/', asyncHandler(async (req, res) => {
  let filteredProducts = [...products];
  
  // Search by name
  if (req.query.search) {
    const searchTerm = req.query.search.toLowerCase();
    filteredProducts = filteredProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm)
    );
  }
  
  // Filter by category
  if (req.query.category) {
    filteredProducts = filteredProducts.filter(product =>
      product.category.toLowerCase() === req.query.category.toLowerCase()
    );
  }
  
  // Filter by inStock
  if (req.query.inStock !== undefined) {
    const inStock = req.query.inStock === 'true';
    filteredProducts = filteredProducts.filter(product => product.inStock === inStock);
  }
  
  // Filter by price range
  if (req.query.minPrice) {
    const minPrice = parseFloat(req.query.minPrice);
    filteredProducts = filteredProducts.filter(product => product.price >= minPrice);
  }
  
  if (req.query.maxPrice) {
    const maxPrice = parseFloat(req.query.maxPrice);
    filteredProducts = filteredProducts.filter(product => product.price <= maxPrice);
  }
  
  // Sorting
  if (req.query.sort) {
    const sortField = req.query.sort;
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    
    filteredProducts.sort((a, b) => {
      if (a[sortField] < b[sortField]) return -1 * sortOrder;
      if (a[sortField] > b[sortField]) return 1 * sortOrder;
      return 0;
    });
  }
  
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedProducts,
    pagination: {
      page,
      limit,
      total: filteredProducts.length,
      pages: Math.ceil(filteredProducts.length / limit),
      hasNext: endIndex < filteredProducts.length,
      hasPrev: page > 1
    },
    filters: {
      search: req.query.search || null,
      category: req.query.category || null,
      inStock: req.query.inStock || null,
      minPrice: req.query.minPrice || null,
      maxPrice: req.query.maxPrice || null
    }
  });
}));

// GET /api/products/search - Dedicated search endpoint
router.get('/search', asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({
      success: false,
      error: 'Search query parameter "q" is required'
    });
  }
  
  const searchResults = products.filter(product =>
    product.name.toLowerCase().includes(q.toLowerCase()) ||
    product.description.toLowerCase().includes(q.toLowerCase()) ||
    product.category.toLowerCase().includes(q.toLowerCase())
  );
  
  res.json({
    success: true,
    data: searchResults,
    query: q,
    count: searchResults.length
  });
}));

// GET /api/products/stats - Product statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = {
    totalProducts: products.length,
    inStock: products.filter(p => p.inStock).length,
    outOfStock: products.filter(p => !p.inStock).length,
    categories: {},
    priceStats: {
      min: Math.min(...products.map(p => p.price)),
      max: Math.max(...products.map(p => p.price)),
      avg: products.reduce((sum, p) => sum + p.price, 0) / products.length
    }
  };
  
  // Count by category
  products.forEach(product => {
    stats.categories[product.category] = (stats.categories[product.category] || 0) + 1;
  });
  
  res.json({
    success: true,
    data: stats
  });
}));

// GET /api/products/:id - Get specific product
router.get('/:id', asyncHandler(async (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  
  if (!product) {
    throw new NotFoundError('Product');
  }
  
  res.json({
    success: true,
    data: product
  });
}));

// POST /api/products - Create new product
router.post('/', validateProduct, asyncHandler(async (req, res) => {
  const { name, description, price, category, inStock } = req.body;
  
  const newProduct = {
    id: uuidv4(),
    name,
    description,
    price,
    category,
    inStock,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  products.push(newProduct);
  
  res.status(201).json({
    success: true,
    data: newProduct,
    message: 'Product created successfully'
  });
}));

// PUT /api/products/:id - Update existing product
router.put('/:id', validateProductUpdate, asyncHandler(async (req, res) => {
  const productIndex = products.findIndex(p => p.id === req.params.id);
  
  if (productIndex === -1) {
    throw new NotFoundError('Product');
  }
  
  const updatedProduct = {
    ...products[productIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  products[productIndex] = updatedProduct;
  
  res.json({
    success: true,
    data: updatedProduct,
    message: 'Product updated successfully'
  });
}));

// DELETE /api/products/:id - Delete product
router.delete('/:id', asyncHandler(async (req, res) => {
  const productIndex = products.findIndex(p => p.id === req.params.id);
  
  if (productIndex === -1) {
    throw new NotFoundError('Product');
  }
  
  const deletedProduct = products.splice(productIndex, 1)[0];
  
  res.json({
    success: true,
    data: deletedProduct,
    message: 'Product deleted successfully'
  });
}));

module.exports = router;