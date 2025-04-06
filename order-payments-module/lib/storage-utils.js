/**
 * Firebase Storage Utilities
 *
 * These functions handle file uploads and downloads using Firebase Storage.
 * They will integrate with the existing Firebase Storage setup in the main application.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Uploads a delivery file to Firebase Storage
 *
 * @param file - The file to upload
 * @param orderId - The ID of the order this file belongs to
 * @param userId - The ID of the user uploading the file
 * @param fileType - Optional label for the file type (e.g., 'delivery', 'requirements')
 */
export function uploadOrderFile(file, orderId, userId, fileType = 'delivery') {
    return __awaiter(this, void 0, void 0, function* () {
        throw new Error('Firebase Storage not configured. Unable to upload file.');
    });
}
/**
 * Lists files for a specific order
 *
 * @param orderId - The ID of the order
 * @param fileType - Optional filter for file type
 */
export function listOrderFiles(orderId, fileType) {
    return __awaiter(this, void 0, void 0, function* () {
        throw new Error('Firebase Storage not configured. Unable to list order files.');
    });
}
/**
 * Deletes a file from Firebase Storage
 *
 * @param filePath - The path to the file in storage
 */
export function deleteOrderFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        throw new Error('Firebase Storage not configured. Unable to delete file.');
    });
}
/**
 * Gets a download URL for a file
 *
 * @param filePath - The path to the file in storage
 */
export function getFileDownloadUrl(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        throw new Error('Firebase Storage not configured. Unable to get download URL.');
    });
}
/**
 * Gets the Firebase Storage folder structure for orders
 *
 * This helps maintain consistent paths across the application
 */
export function getOrderStoragePaths(orderId) {
    return {
        root: `orders/${orderId}`,
        deliveries: `orders/${orderId}/deliveries`,
        requirements: `orders/${orderId}/requirements`,
        messages: `orders/${orderId}/messages`
    };
}
