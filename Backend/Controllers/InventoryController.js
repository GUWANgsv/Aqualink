const Inventory = require("../Model/InventoryModel");
const PDFDocument = require('pdfkit');
const fs = require('fs');

// GET: Display all inventory items
const getAllInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.find().sort({ name: 1 });
    return res.status(200).json({ inventory });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST: Add a new inventory item with full product details
const addInventoryItem = async (req, res, next) => {
  const { 
    name, 
    quantity, 
    unit, 
    minStockLevel, 
    maxStockLevel, 
    supplier,
    price,
    originalPrice,
    description,
    longDescription,
    category,
    image,
    images,
    warranty,
    rating,
    reviews,
    specifications,
    features
  } = req.body;

  try {
    // Check if item already exists
    const existingItem = await Inventory.findOne({ name });
    if (existingItem) {
      return res.status(400).json({ 
        success: false,
        message: "Item already exists in inventory" 
      });
    }

    // Validate required fields
    if (!name || !quantity || !price || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, quantity, price, description, category"
      });
    }

    const newItem = new Inventory({ 
      name, 
      quantity, 
      unit: unit || 'pieces',
      minStockLevel: minStockLevel || 10,
      maxStockLevel: maxStockLevel || 100,
      supplier,
      price,
      originalPrice: originalPrice || price * 1.2,
      description,
      longDescription: longDescription || description,
      category,
      image: image || '/product-default.jpg',
      images: images || [],
      warranty: warranty || '1 Year',
      rating: rating || 4.0,
      reviews: reviews || 0,
      specifications: specifications || {},
      features: features || []
    });
    
    await newItem.save();
    
    console.log(`✅ Added new product to factory inventory: ${name}`);
    
    return res.status(201).json({ 
      success: true,
      message: "Product added to factory inventory successfully",
      item: newItem 
    });
  } catch (err) {
    console.error('❌ Error adding inventory item:', err);
    return res.status(500).json({ 
      success: false,
      message: "Unable to add inventory item",
      error: err.message 
    });
  }
};

// GET: Get inventory item by ID
const getInventoryById = async (req, res, next) => {
  const id = req.params.id;

  try {
    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }
    return res.status(200).json({ item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching inventory item" });
  }
};

// PUT: Update inventory item with full product details
const updateInventoryItem = async (req, res, next) => {
  const id = req.params.id;
  const { 
    name, 
    quantity, 
    unit, 
    minStockLevel, 
    maxStockLevel, 
    supplier,
    price,
    originalPrice,
    description,
    longDescription,
    category,
    image,
    images,
    warranty,
    rating,
    reviews,
    specifications,
    features
  } = req.body;

  try {
    // Validate required fields
    if (!name || !quantity || !price || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, quantity, price, description, category"
      });
    }

    const updateData = {
      name,
      quantity: parseInt(quantity),
      unit: unit || 'pieces',
      minStockLevel: parseInt(minStockLevel) || 10,
      maxStockLevel: parseInt(maxStockLevel) || 100,
      supplier,
      price: parseFloat(price),
      originalPrice: parseFloat(originalPrice) || parseFloat(price) * 1.2,
      description,
      longDescription: longDescription || description,
      category,
      image: image || '/product-default.jpg',
      images: images || [],
      warranty: warranty || '1 Year',
      rating: parseFloat(rating) || 4.0,
      reviews: parseInt(reviews) || 0,
      specifications: specifications || {},
      features: features || []
    };

    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ 
        success: false,
        message: "Inventory item not found" 
      });
    }

    console.log(`✅ Updated inventory item: ${name}`);

    return res.status(200).json({ 
      success: true,
      message: "Inventory item updated successfully",
      item: updatedItem 
    });
  } catch (err) {
    console.error('❌ Error updating inventory item:', err);
    return res.status(500).json({ 
      success: false,
      message: "Unable to update inventory item",
      error: err.message 
    });
  }
};

// DELETE: Delete inventory item
const deleteInventoryItem = async (req, res, next) => {
  const id = req.params.id;

  try {
    const item = await Inventory.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ message: "Unable to delete inventory item" });
    }
    return res.status(200).json({ item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST: Update stock quantity (for production/consumption)
const updateStockQuantity = async (req, res, next) => {
  const id = req.params.id;
  const { quantity, operation } = req.body; // operation: 'add' or 'subtract'

  try {
    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    if (operation === 'add') {
      item.quantity += quantity;
    } else if (operation === 'subtract') {
      if (item.quantity < quantity) {
        return res.status(400).json({ message: "Insufficient stock" });
      }
      item.quantity -= quantity;
    }

    await item.save();
    return res.status(200).json({ item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET: Get inventory statistics
const getInventoryStats = async (req, res, next) => {
  try {
    const totalItems = await Inventory.countDocuments();
    const lowStockItems = await Inventory.countDocuments({ status: 'Low Stock' });
    const outOfStockItems = await Inventory.countDocuments({ status: 'Out of Stock' });
    const inStockItems = await Inventory.countDocuments({ status: 'In Stock' });

    const totalValue = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" }
        }
      }
    ]);

    return res.status(200).json({
      stats: {
        totalItems,
        lowStockItems,
        outOfStockItems,
        inStockItems,
        totalQuantity: totalValue[0]?.totalQuantity || 0
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching statistics" });
  }
};

// GET: Generate PDF report
const generatePDFReport = async (req, res, next) => {
  try {
    const inventory = await Inventory.find().sort({ name: 1 });
    
    const doc = new PDFDocument();
    const filename = `inventory-report-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    doc.pipe(res);
    
    // Add title
    doc.fontSize(24).text('RO Filter Factory - Inventory Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);
    
    // Add table headers
    const tableTop = 150;
    const itemCodeX = 50;
    const nameX = 150;
    const quantityX = 300;
    const statusX = 400;
    
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Item', nameX, tableTop);
    doc.text('Quantity', quantityX, tableTop);
    doc.text('Status', statusX, tableTop);
    
    // Add table data
    doc.fontSize(10).font('Helvetica');
    let yPosition = tableTop + 30;
    
    inventory.forEach((item, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      
      doc.text(item.name, nameX, yPosition);
      doc.text(item.quantity.toString(), quantityX, yPosition);
      doc.text(item.status, statusX, yPosition);
      
      yPosition += 20;
    });
    
    // Add summary
    doc.moveDown(2);
    doc.fontSize(14).font('Helvetica-Bold').text('Summary:', 50);
    doc.fontSize(12).font('Helvetica');
    doc.text(`Total Items: ${inventory.length}`, 50);
    doc.text(`Low Stock Items: ${inventory.filter(item => item.status === 'Low Stock').length}`, 50);
    doc.text(`Out of Stock Items: ${inventory.filter(item => item.status === 'Out of Stock').length}`, 50);
    
    doc.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error generating PDF report" });
  }
};

// GET: Initialize sample inventory data
const initializeSampleData = async (req, res, next) => {
  try {
    const existingItems = await Inventory.countDocuments();
    
    if (existingItems > 0) {
      return res.status(200).json({ 
        message: "Inventory already has data", 
        count: existingItems 
      });
    }

    const sampleItems = [
      {
        name: 'RO Membranes',
        quantity: 50,
        unit: 'pieces',
        minStockLevel: 10,
        maxStockLevel: 100,
        supplier: 'AquaTech Supplies'
      },
      {
        name: 'Mud-filters',
        quantity: 75,
        unit: 'pieces',
        minStockLevel: 15,
        maxStockLevel: 150,
        supplier: 'FilterPro Industries'
      },
      {
        name: 'Mineral Cartridge',
        quantity: 60,
        unit: 'pieces',
        minStockLevel: 12,
        maxStockLevel: 120,
        supplier: 'MineralCorp Ltd'
      },
      {
        name: 'UV Cartridge',
        quantity: 40,
        unit: 'pieces',
        minStockLevel: 8,
        maxStockLevel: 80,
        supplier: 'UVTech Solutions'
      },
      {
        name: 'Water Pumps',
        quantity: 25,
        unit: 'pieces',
        minStockLevel: 5,
        maxStockLevel: 50,
        supplier: 'PumpMaster Inc'
      },
      {
        name: '5L Water Bottles',
        quantity: 200,
        unit: 'bottles',
        minStockLevel: 20,
        maxStockLevel: 200,
        supplier: 'BottleCorp Industries'
      },
      {
        name: '10L Water Bottles',
        quantity: 150,
        unit: 'bottles',
        minStockLevel: 15,
        maxStockLevel: 150,
        supplier: 'BottleCorp Industries'
      },
      {
        name: '20L Water Bottles',
        quantity: 100,
        unit: 'bottles',
        minStockLevel: 10,
        maxStockLevel: 100,
        supplier: 'BottleCorp Industries'
      }
    ];

    const createdItems = await Inventory.insertMany(sampleItems);
    
    return res.status(201).json({ 
      message: "Sample inventory data initialized successfully",
      items: createdItems
    });
  } catch (err) {
    console.error('Error initializing sample data:', err);
    return res.status(500).json({ message: "Unable to initialize sample data" });
  }
};

// POST: Sync product from factory to branch inventory
const syncProductToBranch = async (req, res, next) => {
  const { productId, branchId, quantity } = req.body;

  try {
    // Import BranchInventory and Branch models
    const BranchInventory = require("../Model/BranchInventoryModel");
    const Branch = require("../Model/BranchModel");

    // Get the product from factory inventory
    const factoryProduct = await Inventory.findById(productId);
    if (!factoryProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found in factory inventory"
      });
    }

    // Get branch details
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found"
      });
    }

    // Check if product already exists in branch inventory
    const existingBranchProduct = await BranchInventory.findOne({
      branchId: branchId,
      name: factoryProduct.name
    });

    if (existingBranchProduct) {
      // Update existing product quantity
      existingBranchProduct.quantity += quantity || factoryProduct.quantity;
      await existingBranchProduct.save();
      
      console.log(`✅ Updated existing product in branch: ${factoryProduct.name}`);
      
      return res.status(200).json({
        success: true,
        message: "Product quantity updated in branch inventory",
        product: existingBranchProduct
      });
    } else {
      // Create new product in branch inventory
      const branchProduct = new BranchInventory({
        branchId: branchId,
        branchName: branch.name,
        name: factoryProduct.name,
        quantity: quantity || factoryProduct.quantity,
        unit: factoryProduct.unit,
        minStockLevel: factoryProduct.minStockLevel,
        maxStockLevel: factoryProduct.maxStockLevel,
        price: factoryProduct.price,
        originalPrice: factoryProduct.originalPrice,
        description: factoryProduct.description,
        longDescription: factoryProduct.longDescription,
        category: factoryProduct.category,
        image: factoryProduct.image,
        images: factoryProduct.images,
        warranty: factoryProduct.warranty,
        rating: factoryProduct.rating,
        reviews: factoryProduct.reviews,
        specifications: factoryProduct.specifications,
        features: factoryProduct.features
      });

      await branchProduct.save();
      
      console.log(`✅ Added new product to branch inventory: ${factoryProduct.name}`);
      
      return res.status(201).json({
        success: true,
        message: "Product added to branch inventory successfully",
        product: branchProduct
      });
    }
  } catch (err) {
    console.error('❌ Error syncing product to branch:', err);
    return res.status(500).json({
      success: false,
      message: "Unable to sync product to branch",
      error: err.message
    });
  }
};

// POST: Add product to factory and sync to branch in one operation
const addProductAndSyncToBranch = async (req, res, next) => {
  console.log('🚀 AddProductAndSyncToBranch called with data:', req.body);
  console.log('📁 Files:', req.files);
  console.log('👤 User:', req.user);
  
  // Handle both JSON and multipart/form-data requests
  let productData;
  let uploadedImages = [];
  
  if (req.files && req.files.length > 0) {
    // Handle multipart/form-data with file uploads
    console.log('📤 Processing file uploads...');
    
    // Process uploaded files
    uploadedImages = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: `/products/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));
    
    // Extract data from form fields
    productData = {
      name: req.body.name,
      quantity: parseInt(req.body.quantity),
      unit: req.body.unit || 'pieces',
      minStockLevel: parseInt(req.body.minStockLevel) || 10,
      maxStockLevel: parseInt(req.body.maxStockLevel) || 100,
      supplier: req.body.supplier,
      price: parseFloat(req.body.price),
      originalPrice: parseFloat(req.body.originalPrice) || parseFloat(req.body.price) * 1.2,
      description: req.body.description,
      longDescription: req.body.longDescription,
      category: req.body.category,
      warranty: req.body.warranty || '1 Year',
      rating: parseFloat(req.body.rating) || 4.0,
      reviews: parseInt(req.body.reviews) || 0,
      specifications: req.body.specifications ? JSON.parse(req.body.specifications) : {},
      features: req.body.features ? JSON.parse(req.body.features) : [],
      branchId: req.body.branchId,
      syncToBranch: req.body.syncToBranch === 'true'
    };
  } else {
    // Handle regular JSON request
    productData = {
      name: req.body.name,
      quantity: parseInt(req.body.quantity),
      unit: req.body.unit || 'pieces',
      minStockLevel: parseInt(req.body.minStockLevel) || 10,
      maxStockLevel: parseInt(req.body.maxStockLevel) || 100,
      supplier: req.body.supplier,
      price: parseFloat(req.body.price),
      originalPrice: parseFloat(req.body.originalPrice) || parseFloat(req.body.price) * 1.2,
      description: req.body.description,
      longDescription: req.body.longDescription,
      category: req.body.category,
      warranty: req.body.warranty || '1 Year',
      rating: parseFloat(req.body.rating) || 4.0,
      reviews: parseInt(req.body.reviews) || 0,
      specifications: req.body.specifications || {},
      features: req.body.features || [],
      branchId: req.body.branchId,
      syncToBranch: req.body.syncToBranch !== false
    };
  }
  
  const { 
    name, 
    quantity, 
    unit, 
    minStockLevel, 
    maxStockLevel, 
    supplier,
    price,
    originalPrice,
    description,
    longDescription,
    category,
    warranty,
    rating,
    reviews,
    specifications,
    features,
    branchId,
    syncToBranch
  } = productData;

  try {
    // Import BranchInventory and Branch models
    const BranchInventory = require("../Model/BranchInventoryModel");
    const Branch = require("../Model/BranchModel");

    // Check if item already exists in factory
    const existingItem = await Inventory.findOne({ name });
    if (existingItem) {
      console.log('❌ Product already exists:', name);
      return res.status(400).json({ 
        success: false,
        message: "Item already exists in factory inventory" 
      });
    }

    // Validate required fields
    if (!name || !quantity || !price || !description || !category) {
      console.log('❌ Validation failed - missing required fields:', { name, quantity, price, description, category });
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, quantity, price, description, category"
      });
    }

    // Prepare image data
    let imageData = {
      image: '/product-default.jpg',
      images: []
    };
    
    if (uploadedImages.length > 0) {
      // Use uploaded images
      imageData.image = uploadedImages[0].path;
      imageData.images = uploadedImages.map(img => img.path);
      console.log('📸 Using uploaded images:', imageData);
    } else if (req.body.image) {
      // Use manually provided image path
      imageData.image = req.body.image;
      imageData.images = req.body.images || [req.body.image];
      console.log('📸 Using manual image path:', imageData);
    }

    // Add to factory inventory
    const newItem = new Inventory({ 
      name, 
      quantity, 
      unit: unit || 'pieces',
      minStockLevel: minStockLevel || 10,
      maxStockLevel: maxStockLevel || 100,
      supplier,
      price,
      originalPrice: originalPrice || price * 1.2,
      description,
      longDescription: longDescription || description,
      category,
      image: imageData.image,
      images: imageData.images,
      warranty: warranty || '1 Year',
      rating: rating || 4.0,
      reviews: reviews || 0,
      specifications: specifications || {},
      features: features || []
    });
    
    await newItem.save();
    console.log(`✅ Added new product to factory inventory: ${name}`, newItem);

    let branchProduct = null;
    
    // Sync to branch if requested
    if (syncToBranch && branchId) {
      console.log(`🔄 Syncing to branch: ${branchId}`);
      const branch = await Branch.findById(branchId);
      if (!branch) {
        console.log('❌ Branch not found:', branchId);
        return res.status(404).json({
          success: false,
          message: "Branch not found"
        });
      }
      console.log('✅ Branch found:', branch.name);

      // Create product in branch inventory
      branchProduct = new BranchInventory({
        branchId: branchId,
        branchName: branch.name,
        name: newItem.name,
        quantity: newItem.quantity,
        unit: newItem.unit,
        minStockLevel: newItem.minStockLevel,
        maxStockLevel: newItem.maxStockLevel,
        price: newItem.price,
        originalPrice: newItem.originalPrice,
        description: newItem.description,
        longDescription: newItem.longDescription,
        category: newItem.category,
        image: newItem.image,
        images: newItem.images,
        warranty: newItem.warranty,
        rating: newItem.rating,
        reviews: newItem.reviews,
        specifications: newItem.specifications,
        features: newItem.features
      });

      await branchProduct.save();
      console.log(`✅ Synced product to branch inventory: ${name}`, branchProduct);
    }
    
    const response = { 
      success: true,
      message: "Product added to factory inventory" + (syncToBranch ? " and synced to branch" : "") + " successfully",
      factoryProduct: newItem,
      branchProduct: branchProduct
    };
    
    console.log('🎉 Sending success response:', response);
    return res.status(201).json(response);
  } catch (err) {
    console.error('❌ Error adding product:', err);
    console.error('❌ Error stack:', err.stack);
    return res.status(500).json({ 
      success: false,
      message: "Unable to add product",
      error: err.message 
    });
  }
};

exports.getAllInventory = getAllInventory;
exports.addInventoryItem = addInventoryItem;
exports.getInventoryById = getInventoryById;
exports.updateInventoryItem = updateInventoryItem;
exports.deleteInventoryItem = deleteInventoryItem;
exports.updateStockQuantity = updateStockQuantity;
exports.getInventoryStats = getInventoryStats;
exports.generatePDFReport = generatePDFReport;
exports.initializeSampleData = initializeSampleData;
exports.syncProductToBranch = syncProductToBranch;
exports.addProductAndSyncToBranch = addProductAndSyncToBranch;
