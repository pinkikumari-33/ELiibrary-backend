const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadFolder = path.join(
    process.cwd(),
    "uploads",
    "books"
);

if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, {
        recursive: true
    });
}

const storage = multer.diskStorage({

    destination: (req, file, callback) => {
        callback(null, uploadFolder);
    },

    filename: (req, file, callback) => {

        const fileExtension =
            path.extname(file.originalname).toLowerCase();

        const uniqueName =
            `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;

        callback(null, uniqueName);
    }
});

const fileFilter = (req, file, callback) => {

    const allowedExtensions = [
        ".pdf",
        ".epub"
    ];

    const extension =
        path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(extension)) {
        return callback(
            new Error("Only PDF and EPUB files are allowed.")
        );
    }

    callback(null, true);
};

const bookFileUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024
    }
});

module.exports = bookFileUpload;