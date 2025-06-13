import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import crypto from 'crypto';

const MOUNT_PATH = process.env.RENDER_DISK_MOUNT_PATH;
if (!MOUNT_PATH) {
    console.warn("----------------------------------------------------------------");
    console.warn("WARNING: RENDER_DISK_MOUNT_PATH environment variable is not set!");
    console.warn("Falling back to './persistent_uploads' for local development.");
    console.warn("Ensure RENDER_DISK_MOUNT_PATH is set in your Render environment.");
    console.warn("----------------------------------------------------------------");
}
const baseUploadPath = MOUNT_PATH || path.join(process.cwd(), 'persistent_uploads');

const UPLOAD_DIR = path.join(baseUploadPath, 'uploads');

try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Upload directory ensured at: ${UPLOAD_DIR}`);
} catch (err) {
    console.error(`FATAL: Failed to create upload directory ${UPLOAD_DIR}. Check permissions and mount path.`, err);
}
const storage = multer.diskStorage({
    destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
        try {
             fs.mkdirSync(UPLOAD_DIR, { recursive: true });
             cb(null, UPLOAD_DIR);
        } catch(err: any) {
             console.error(`Error ensuring upload directory exists during upload: ${UPLOAD_DIR}`, err);
             cb(err, '');
        }
    },
    filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const extension = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
        'application/zip',
        'application/vnd.rar',
        'application/x-7z-compressed',
        'image/jpeg',
        'image/png',
        'image/gif',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        console.warn(`Rejected file upload: ${file.originalname} (Type: ${file.mimetype})`);
        const error = new Error('File type not allowed. Check allowed formats.');
        cb(error, false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});

export const deleteFile = async (filePathFromDb: string): Promise<void> => {
    if (!filePathFromDb) {
        console.warn("Attempted to delete file with empty path.");
        return;
    }
    const fullPath = path.join(baseUploadPath, filePathFromDb);
    console.log(`Attempting to delete file at: ${fullPath}`);

    try {
        await fs.promises.unlink(fullPath);
        console.log(`Successfully deleted file: ${fullPath}`);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.warn(`File not found for deletion (may have been deleted already or never existed): ${fullPath}`);
        } else {
            console.error(`Error deleting file ${fullPath}:`, error);
            throw error;
        }
    }
};