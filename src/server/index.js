import express from 'express';
import { google } from 'googleapis';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Simple in-memory cache
const cache = {
  jobs: null,
  categories: null,
  timestamp: null
};

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n')
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Jobs';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Helper function to fetch all jobs from Google Sheets
const fetchJobsFromSheets = async () => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:J`
    });

    const rows = response.data.values || [];
    
    return rows.map((row, index) => ({
      id: row[0] || uuidv4(),
      title: row[1] || '',
      company: row[2] || '',
      location: row[3] || '',
      type: row[4] || '',
      category: row[5] || '',
      description: row[6] || '',
      requirements: row[7] || '',
      salary: row[8] || '',
      datePosted: row[9] || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error fetching jobs from Google Sheets:', error);
    throw new Error('Failed to fetch jobs');
  }
};

// Helper function to get all jobs with caching
const getJobs = async () => {
  const cacheTTL = parseInt(process.env.CACHE_TTL || '300', 10) * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  
  // Return cached data if it's still valid
  if (cache.jobs && cache.timestamp && (currentTime - cache.timestamp < cacheTTL)) {
    return cache.jobs;
  }
  
  // Fetch fresh data
  const jobs = await fetchJobsFromSheets();
  
  // Update cache
  cache.jobs = jobs;
  cache.timestamp = currentTime;
  
  return jobs;
};

// Helper function to get categories with counts
const getCategories = async () => {
  if (cache.categories && cache.timestamp) {
    return cache.categories;
  }
  
  const jobs = await getJobs();
  
  // Extract unique categories and count jobs in each
  const categoryCounts = jobs.reduce((acc, job) => {
    if (job.category) {
      if (!acc[job.category]) {
        acc[job.category] = 0;
      }
      acc[job.category]++;
    }
    return acc;
  }, {});
  
  const categories = Object.entries(categoryCounts).map(([name, count], index) => ({
    id: index + 1,
    name,
    count
  }));
  
  cache.categories = categories;
  
  return categories;
};

// API Routes

// Get all jobs with optional filtering
app.get('/api/jobs', async (req, res) => {
  try {
    const { search, category, location, type } = req.query;
    let jobs = await getJobs();
    
    // Apply filters if provided
    if (search) {
      const searchLower = search.toLowerCase();
      jobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower)
      );
    }
    
    if (category) {
      jobs = jobs.filter(job => job.category === category);
    }
    
    if (location) {
      jobs = jobs.filter(job => job.location === location);
    }
    
    if (type) {
      jobs = jobs.filter(job => job.type === type);
    }
    
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// Get a single job by ID
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const jobs = await getJobs();
    const job = jobs.find(job => job.id === id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Failed to fetch job' });
  }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Apply for a job
app.post('/api/jobs/:id/apply', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, coverLetter } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Name, email, and phone are required' });
    }
    
    // In a real application, you would save this to a database or send an email
    // For this demo, we'll just return success
    
    res.json({ 
      success: true, 
      message: 'Application submitted successfully',
      application: {
        jobId: id,
        name,
        email,
        phone,
        dateApplied: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ message: 'Failed to submit application' });
  }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if username matches
    if (username !== process.env.ADMIN_USERNAME) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000, // 1 hour
      sameSite: 'strict'
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
});

// Verify admin token
app.get('/api/admin/verify', authenticateToken, (req, res) => {
  res.json({ authenticated: true, username: req.user.username });
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// Admin: Create a new job
app.post('/api/admin/jobs', authenticateToken, async (req, res) => {
  try {
    const { title, company, location, type, category, description, requirements, salary } = req.body;
    
    // Validate required fields
    if (!title || !company || !location || !type || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const newJob = {
      id: uuidv4(),
      title,
      company,
      location,
      type,
      category: category || '',
      description,
      requirements: requirements || '',
      salary: salary || '',
      datePosted: new Date().toISOString()
    };
    
    // In a real application, you would add this to Google Sheets
    // For this demo, we'll just return success
    
    // Invalidate cache
    cache.jobs = null;
    cache.categories = null;
    cache.timestamp = null;
    
    res.status(201).json({ 
      success: true, 
      message: 'Job created successfully',
      job: newJob
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Failed to create job' });
  }
});

// Admin: Update a job
app.put('/api/admin/jobs/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, company, location, type, category, description, requirements, salary } = req.body;
    
    // Validate required fields
    if (!title || !company || !location || !type || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // In a real application, you would update this in Google Sheets
    // For this demo, we'll just return success
    
    // Invalidate cache
    cache.jobs = null;
    cache.categories = null;
    cache.timestamp = null;
    
    res.json({ 
      success: true, 
      message: 'Job updated successfully',
      job: {
        id,
        title,
        company,
        location,
        type,
        category: category || '',
        description,
        requirements: requirements || '',
        salary: salary || '',
        datePosted: new Date().toISOString() // In a real app, you'd keep the original date
      }
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Failed to update job' });
  }
});

// Admin: Delete a job
app.delete('/api/admin/jobs/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real application, you would delete this from Google Sheets
    // For this demo, we'll just return success
    
    // Invalidate cache
    cache.jobs = null;
    cache.categories = null;
    cache.timestamp = null;
    
    res.json({ 
      success: true, 
      message: 'Job deleted successfully',
      id
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Failed to delete job' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
