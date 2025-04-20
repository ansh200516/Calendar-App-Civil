// src/file-upload.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Using standard fs module
import { Request } from 'express';
import crypto from 'crypto'; // For generating more unique filenames

// --- Persistent Disk Configuration ---
// Get the mount path from environment variable set in Render.
// Provide a fallback for local dev, but ENV var is crucial for Render.
const MOUNT_PATH = process.env.RENDER_DISK_MOUNT_PATH;
if (!MOUNT_PATH) {
    console.warn("----------------------------------------------------------------");
    console.warn("WARNING: RENDER_DISK_MOUNT_PATH environment variable is not set!");
    console.warn("Falling back to './persistent_uploads' for local development.");
    console.warn("Ensure RENDER_DISK_MOUNT_PATH is set in your Render environment.");
    console.warn("----------------------------------------------------------------");
}
// Use fallback only if MOUNT_PATH is truly missing (for local dev)
const baseUploadPath = MOUNT_PATH || path.join(process.cwd(), 'persistent_uploads');

// Define the specific directory *within* the mount path for uploads
const UPLOAD_DIR = path.join(baseUploadPath, 'uploads');

// --- Ensure Upload Directory Exists on Startup ---
try {
    // Use recursive: true to create parent directories if they don't exist
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Upload directory ensured at: ${UPLOAD_DIR}`);
} catch (err) {
    console.error(`FATAL: Failed to create upload directory ${UPLOAD_DIR}. Check permissions and mount path.`, err);
    // Depending on your app's needs, you might want to exit the process
    // process.exit(1);
}
// ------------------------------------

// --- Multer Storage Configuration ---
const storage = multer.diskStorage({
    destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
        // Double-check directory exists before saving (paranoia is good)
        // This helps if the directory was somehow removed after startup
        try {
             fs.mkdirSync(UPLOAD_DIR, { recursive: true });
             cb(null, UPLOAD_DIR); // Save to the persistent disk location
        } catch(err: any) {
             console.error(`Error ensuring upload directory exists during upload: ${UPLOAD_DIR}`, err);
             cb(err, ''); // Pass error to multer
        }
    },
    filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
        // Create a more unique filename to avoid collisions
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const extension = path.extname(file.originalname);
        // We only need the filename part here, the destination function handles the directory
        cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
});

// --- File Filter ---
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Expanded list based on your frontend accept attribute, adjust as needed
    const allowedMimeTypes = [
        'application/pdf', // PDF
        'application/msword', // DOC
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
        'application/vnd.ms-powerpoint', // PPT
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
        'application/vnd.ms-excel', // XLS
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
        'text/plain', // TXT
        'text/csv', // CSV
        'application/zip', // ZIP
        'application/vnd.rar', // RAR
        'application/x-7z-compressed', // 7z
        'image/jpeg', // JPG/JPEG
        'image/png', // PNG
        'image/gif', // GIF
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); // Accept file
    } else {
        console.warn(`Rejected file upload: ${file.originalname} (Type: ${file.mimetype})`);
        // Create an error object to pass back to Multer
        const error = new Error('File type not allowed. Check allowed formats.');
        // You can add a property to the error if needed elsewhere
        // error.code = 'INVALID_FILE_TYPE';
        cb(error, false); // Reject file
    }
};

// --- Configure Multer Export ---
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // Limit file size to 10MB (adjust as needed)
    },
});

// --- Helper Function to Delete a File from Persistent Storage ---
/**
 * Deletes a file from the persistent storage.
 * @param filePathFromDb The relative path stored in the database (e.g., "uploads/filename.ext")
 */
export const deleteFile = async (filePathFromDb: string): Promise<void> => {
     // Check if the path is valid / not empty
    if (!filePathFromDb) {
        console.warn("Attempted to delete file with empty path.");
        return; // Or throw an error if this case is unexpected
    }
    // Reconstruct the *full* path on the persistent disk
    const fullPath = path.join(baseUploadPath, filePathFromDb);
    console.log(`Attempting to delete file at: ${fullPath}`);

    try {
        // Use async unlink
        await fs.promises.unlink(fullPath);
        console.log(`Successfully deleted file: ${fullPath}`);
    } catch (error: any) {
        // Check if the error is because the file doesn't exist (which is often okay during deletion)
        if (error.code === 'ENOENT') {
            console.warn(`File not found for deletion (may have been deleted already or never existed): ${fullPath}`);
            // Decide if you want to throw an error here or just log it.
            // For deletion, often logging is sufficient if the goal is just to ensure it's gone.
        } else {
            // For other errors (like permissions), log and re-throw
            console.error(`Error deleting file ${fullPath}:`, error);
            throw error; // Re-throw the error to be handled by the calling route
        }
    }
};