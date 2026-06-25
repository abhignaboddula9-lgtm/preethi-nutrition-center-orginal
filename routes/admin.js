const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const protect = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');

// Models
const Post = require('../models/Post');
const Product = require('../models/Product');
const SuccessStory = require('../models/SuccessStory');
const Blog = require('../models/Blog');
const About = require('../models/About');
const WebConfig = require('../models/WebConfig');
const Contact = require('../models/Contact');

const router = express.Router();

// Apply Admin protections to all routes in this file
router.use(protect);
router.use(adminOnly);

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'public', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File Filter for Image/Video uploads
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/i;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB Limit
});

// Helper: Delete file from local filesystem
const deleteLocalFile = (relativePath) => {
  if (!relativePath) return;
  // Convert web url/path like '/uploads/file.jpg' to local path
  const filename = path.basename(relativePath);
  const filePath = path.join(__dirname, '..', 'public', 'uploads', filename);
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Error deleting file: ${filePath}`, err);
    });
  }
};

/* ==========================================================================
   1. POSTS MANAGEMENT (Instagram-style & Transformations)
   ========================================================================== */

// @desc    Create a Feed Post
// @route   POST /api/admin/posts
// @access  Private (Admin Only)
router.post(
  '/posts',
  upload.fields([
    { name: 'media', maxCount: 1 },
    { name: 'beforeImage', maxCount: 1 },
    { name: 'afterImage', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { type, caption, clientName, clientDetails } = req.body;

      if (!type) {
        return res.status(400).json({ success: false, message: 'Post type is required' });
      }

      let postData = { type, caption };

      if (type === 'transformation') {
        const files = req.files || {};
        if (!files.beforeImage || !files.afterImage) {
          return res.status(400).json({
            success: false,
            message: 'Both Before and After images are required for transformation posts'
          });
        }

        postData.beforeImageUrl = `/uploads/${files.beforeImage[0].filename}`;
        postData.afterImageUrl = `/uploads/${files.afterImage[0].filename}`;
        // Standard mediaUrl can be the after image
        postData.mediaUrl = postData.afterImageUrl;
        postData.mediaType = 'image';
        postData.clientName = clientName || '';
        postData.clientDetails = clientDetails || '';
      } else {
        const files = req.files || {};
        if (!files.media) {
          return res.status(400).json({ success: false, message: 'Media file is required' });
        }

        const mediaFile = files.media[0];
        postData.mediaUrl = `/uploads/${mediaFile.filename}`;
        postData.mediaType = mediaFile.mimetype.startsWith('video/') ? 'video' : 'image';
      }

      const post = await Post.create(postData);
      res.status(201).json({ success: true, data: post });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// @desc    Delete a Feed Post
// @route   DELETE /api/admin/posts/:id
// @access  Private (Admin Only)
router.delete('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Clean up local media files
    deleteLocalFile(post.mediaUrl);
    deleteLocalFile(post.beforeImageUrl);
    deleteLocalFile(post.afterImageUrl);

    await post.deleteOne();
    res.status(200).json({ success: true, message: 'Post removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a Feed Post
// @route   PUT /api/admin/posts/:id
// @access  Private (Admin Only)
router.put(
  '/posts/:id',
  upload.fields([
    { name: 'media', maxCount: 1 },
    { name: 'beforeImage', maxCount: 1 },
    { name: 'afterImage', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { type, caption, clientName, clientDetails } = req.body;
      let post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      const updates = {
        type: type || post.type,
        caption: caption !== undefined ? caption : post.caption,
        clientName: clientName !== undefined ? clientName : post.clientName,
        clientDetails: clientDetails !== undefined ? clientDetails : post.clientDetails
      };

      const files = req.files || {};

      if (updates.type === 'transformation') {
        if (files.beforeImage) {
          deleteLocalFile(post.beforeImageUrl);
          updates.beforeImageUrl = `/uploads/${files.beforeImage[0].filename}`;
        }
        if (files.afterImage) {
          deleteLocalFile(post.afterImageUrl);
          updates.afterImageUrl = `/uploads/${files.afterImage[0].filename}`;
          // Set mediaUrl to afterImage for standard card viewing
          updates.mediaUrl = updates.afterImageUrl;
        }
      } else {
        if (files.media) {
          deleteLocalFile(post.mediaUrl);
          const mediaFile = files.media[0];
          updates.mediaUrl = `/uploads/${mediaFile.filename}`;
          updates.mediaType = mediaFile.mimetype.startsWith('video/') ? 'video' : 'image';
        }
      }

      post = await Post.findByIdAndUpdate(req.params.id, updates, { new: true });
      res.status(200).json({ success: true, data: post });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/* ==========================================================================
   2. PRODUCTS MANAGEMENT (Herbalife Products)
   ========================================================================== */

// @desc    Add a product
// @route   POST /api/admin/products
// @access  Private (Admin Only)
router.post('/products', upload.single('productImg'), async (req, res) => {
  try {
    const { name, price, buyLink, details } = req.body;

    if (!name || !buyLink || !details) {
      return res.status(400).json({ success: false, message: 'Name, purchase link, and details are required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Product image file is required' });
    }

    const product = await Product.create({
      name,
      price: parseFloat(price) || 0,
      buyLink,
      details,
      imageUrl: `/uploads/${req.file.filename}`
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a product details
// @route   PUT /api/admin/products/:id
// @access  Private (Admin Only)
router.put('/products/:id', upload.single('productImg'), async (req, res) => {
  try {
    const { name, price, buyLink, details } = req.body;
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updates = {
      name: name || product.name,
      price: price !== undefined ? parseFloat(price) : product.price,
      buyLink: buyLink || product.buyLink,
      details: details || product.details
    };

    if (req.file) {
      // Remove old image
      deleteLocalFile(product.imageUrl);
      updates.imageUrl = `/uploads/${req.file.filename}`;
    }

    product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private (Admin Only)
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    deleteLocalFile(product.imageUrl);
    await product.deleteOne();
    res.status(200).json({ success: true, message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================================
   3. SUCCESS STORIES MANAGEMENT (Before/After Testimonials)
   ========================================================================== */

// @desc    Create Success Story
// @route   POST /api/admin/success
// @access  Private (Admin Only)
router.post(
  '/success',
  upload.fields([
    { name: 'successBefore', maxCount: 1 },
    { name: 'successAfter', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { clientName, clientDetails, testimonial } = req.body;
      const files = req.files || {};

      if (!clientName || !clientDetails || !testimonial) {
        return res.status(400).json({ success: false, message: 'Client name, details, and testimonial are required' });
      }

      if (!files.successBefore || !files.successAfter) {
        return res.status(400).json({ success: false, message: 'Both Before and After images are required' });
      }

      const story = await SuccessStory.create({
        clientName,
        clientDetails,
        testimonial,
        beforeImageUrl: `/uploads/${files.successBefore[0].filename}`,
        afterImageUrl: `/uploads/${files.successAfter[0].filename}`
      });

      res.status(201).json({ success: true, data: story });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// @desc    Delete Success Story
// @route   DELETE /api/admin/success/:id
// @access  Private (Admin Only)
router.delete('/success/:id', async (req, res) => {
  try {
    const story = await SuccessStory.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    deleteLocalFile(story.beforeImageUrl);
    deleteLocalFile(story.afterImageUrl);

    await story.deleteOne();
    res.status(200).json({ success: true, message: 'Success story removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================================
   4. BLOGS MANAGEMENT (Articles)
   ========================================================================== */

// @desc    Publish Blog Article
// @route   POST /api/admin/blogs
// @access  Private (Admin Only)
router.post('/blogs', async (req, res) => {
  try {
    const { title, category, summary, content, author, readTime } = req.body;

    if (!title || !category || !summary || !content) {
      return res.status(400).json({ success: false, message: 'Title, category, summary, and content are required' });
    }

    const blog = await Blog.create({
      title,
      category,
      summary,
      content,
      author: author || "Preethi Ma'am",
      readTime: readTime || '5 min read'
    });

    res.status(201).json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update Blog Article
// @route   PUT /api/admin/blogs/:id
// @access  Private (Admin Only)
router.put('/blogs/:id', async (req, res) => {
  try {
    const { title, category, summary, content, author, readTime } = req.body;
    let blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog article not found' });
    }

    const updates = {
      title: title || blog.title,
      category: category || blog.category,
      summary: summary || blog.summary,
      content: content || blog.content,
      author: author || blog.author,
      readTime: readTime || blog.readTime
    };

    blog = await Blog.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete Blog Article
// @route   DELETE /api/admin/blogs/:id
// @access  Private (Admin Only)
router.delete('/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    await blog.deleteOne();
    res.status(200).json({ success: true, message: 'Blog article removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================================
   5. EDITABLE ABOUT PAGE CONTENT
   ========================================================================== */

// @desc    Update About page contents
// @route   PUT /api/admin/about
// @access  Private (Admin Only)
router.put('/about', async (req, res) => {
  try {
    const { heroTitle, heroSubtitle, mainContent, mission, vision, experienceYears } = req.body;

    if (!heroTitle || !heroSubtitle || !mainContent || !mission || !vision) {
      return res.status(400).json({ success: false, message: 'All about page fields are required' });
    }

    // Since there should only be one About content document, we find one or create one
    let about = await About.findOne();
    const updateData = {
      heroTitle,
      heroSubtitle,
      mainContent,
      mission,
      vision,
      experienceYears: parseInt(experienceYears) || 15
    };

    if (about) {
      about = await About.findByIdAndUpdate(about._id, updateData, { new: true });
    } else {
      about = await About.create(updateData);
    }

    res.status(200).json({ success: true, data: about });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update global website configuration (Home, About, Contact, Banners)
// @route   PUT /api/admin/content
// @access  Private (Admin Only)
router.put('/content', upload.single('homeHeroImageFile'), async (req, res) => {
  try {
    const {
      homeHeroTitle,
      homeHeroSubtitle,
      contactPhone,
      contactEmail,
      contactAddress,
      operatingHours,
      aboutHeroTitle,
      aboutHeroSubtitle,
      aboutMainContent,
      aboutMission,
      aboutVision,
      aboutExperienceYears
    } = req.body;

    let config = await WebConfig.findOne();
    const updateData = {
      homeHeroTitle: homeHeroTitle || undefined,
      homeHeroSubtitle: homeHeroSubtitle || undefined,
      contactPhone: contactPhone || undefined,
      contactEmail: contactEmail || undefined,
      contactAddress: contactAddress || undefined,
      operatingHours: operatingHours || undefined,
      aboutHeroTitle: aboutHeroTitle || undefined,
      aboutHeroSubtitle: aboutHeroSubtitle || undefined,
      aboutMainContent: aboutMainContent || undefined,
      aboutMission: aboutMission || undefined,
      aboutVision: aboutVision || undefined,
      aboutExperienceYears: aboutExperienceYears !== undefined ? parseInt(aboutExperienceYears) : undefined
    };

    // Filter out undefined keys so we don't overwrite with nulls
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    if (req.file) {
      // If a new hero image is uploaded, we update the banner URL
      if (config && config.homeHeroImage && config.homeHeroImage.startsWith('/uploads/')) {
        deleteLocalFile(config.homeHeroImage);
      }
      updateData.homeHeroImage = `/uploads/${req.file.filename}`;
    }

    if (config) {
      config = await WebConfig.findByIdAndUpdate(config._id, updateData, { new: true });
    } else {
      config = await WebConfig.create(updateData);
    }

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================================
   6. CONTACT QUERIES MANAGEMENT (Admin Only)
   ========================================================================== */

// @desc    Get all contact queries
// @route   GET /api/admin/contacts
// @access  Private (Admin Only)
router.get('/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Mark contact query as responded
// @route   POST /api/admin/contacts/:id/respond
// @access  Private (Admin Only)
router.post('/contacts/:id/respond', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact query not found' });
    }
    contact.responded = true;
    await contact.save();
    res.status(200).json({ success: true, message: 'Query marked as responded', data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a contact query
// @route   DELETE /api/admin/contacts/:id
// @access  Private (Admin Only)
router.delete('/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact query not found' });
    }
    await contact.deleteOne();
    res.status(200).json({ success: true, message: 'Contact query successfully deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
