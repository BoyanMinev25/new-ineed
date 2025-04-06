/**
 * Firebase Storage Utilities
 * 
 * These functions handle file uploads and downloads using Firebase Storage.
 * They will integrate with the existing Firebase Storage setup in the main application.
 */

interface UploadResult {
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: Date;
  path: string;
}

/**
 * Uploads a delivery file to Firebase Storage
 * 
 * @param file - The file to upload
 * @param orderId - The ID of the order this file belongs to
 * @param userId - The ID of the user uploading the file
 * @param fileType - Optional label for the file type (e.g., 'delivery', 'requirements')
 */
export async function uploadOrderFile(
  file: File,
  orderId: string,
  userId: string,
  fileType: string = 'delivery'
): Promise<UploadResult> {
  throw new Error('Firebase Storage not configured. Unable to upload file.');
}

/**
 * Lists files for a specific order
 * 
 * @param orderId - The ID of the order
 * @param fileType - Optional filter for file type
 */
export async function listOrderFiles(
  orderId: string,
  fileType?: string
): Promise<UploadResult[]> {
  throw new Error('Firebase Storage not configured. Unable to list order files.');
}

/**
 * Deletes a file from Firebase Storage
 * 
 * @param filePath - The path to the file in storage
 */
export async function deleteOrderFile(filePath: string): Promise<void> {
  throw new Error('Firebase Storage not configured. Unable to delete file.');
}

/**
 * Gets a download URL for a file
 * 
 * @param filePath - The path to the file in storage
 */
export async function getFileDownloadUrl(filePath: string): Promise<string> {
  throw new Error('Firebase Storage not configured. Unable to get download URL.');
}

/**
 * Gets the Firebase Storage folder structure for orders
 * 
 * This helps maintain consistent paths across the application
 */
export function getOrderStoragePaths(orderId: string) {
  return {
    root: `orders/${orderId}`,
    deliveries: `orders/${orderId}/deliveries`,
    requirements: `orders/${orderId}/requirements`,
    messages: `orders/${orderId}/messages`
  };
} 