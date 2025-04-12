import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { Request } from 'express';

// Set up storage for uploaded files
const uploadDir = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
fs.ensureDirSync(uploadDir);

// Customizing storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Store files in 'uploads' directory
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter to only accept PDFs and certain document types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept PDFs and common document formats
  const allowedFileTypes = [
    'application/pdf',                                               // PDF
    'application/msword',                                           // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.ms-powerpoint',                                // PPT
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    'application/vnd.ms-excel',                                     // XLS
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'text/plain'                                                    // TXT
  ];
  
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed. Only PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX and TXT files are allowed.'));
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit file size to 10MB
  },
});

// Helper function to delete a file
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (await fs.pathExists(fullPath)) {
      await fs.unlink(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};