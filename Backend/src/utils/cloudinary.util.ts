import cloudinary from "../config/cloudinary.js";
import fs from "fs/promises";

/**
 * Uploads a file to Cloudinary
 * @param filePath - Local file path
 * @param options - Upload options
 * @returns Upload result with file details
 */
export async function uploadToCloudinary(
  filePath: string,
  options: {
    folder?: string;
    resource_type?: string;
    use_filename?: boolean;
    unique_filename?: boolean;
    mimetype?: string; // Pass file mimetype for proper handling
  } = {},
) {
  try {
    // Use 'auto' resource type which handles PDFs as images/documents for preview
    // 'raw' forces download/binary behavior which breaks browser preview

    console.log(
      `📄 Uploading file with resource_type: ${options.resource_type || "auto"}`,
    );

    const result = await cloudinary.uploader.upload(filePath, {
      folder: options.folder || "finance-tracker-receipts",
      resource_type: (options.resource_type as any) || "auto",
      use_filename: options.use_filename ?? true,
      unique_filename: options.unique_filename ?? true,
      // Ensure files are publicly accessible without authentication
      type: "upload",
      access_mode: "public",
    });

    return {
      success: true,
      data: {
        public_id: result.public_id,
        url: result.secure_url,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes,
        width: result.width || null,
        height: result.height || null,
        created_at: result.created_at,
      },
    };
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload to Cloudinary",
    };
  }
}

/**
 * Deletes a file from Cloudinary
 * @param publicId - File's public ID
 * @param resourceType - Resource type (image, video, raw)
 * @returns Deletion result
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: string = "image",
) {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType as any,
    });

    return {
      success: result.result === "ok",
      result: result.result,
    };
  } catch (error: any) {
    console.error("Cloudinary deletion error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete from Cloudinary",
    };
  }
}

/**
 * Generates an optimized image URL
 * @param publicId - Image's public ID
 * @param transformations - Transformation options
 * @returns Optimized URL
 */
export function getOptimizedUrl(
  publicId: string,
  transformations: {
    width?: number;
    height?: number;
    quality?: string;
    fetch_format?: string;
  } = {},
) {
  return cloudinary.url(publicId, {
    quality: transformations.quality || "auto",
    fetch_format: (transformations.fetch_format as any) || "auto",
    width: transformations.width,
    height: transformations.height,
  });
}

/**
 * Deletes a local file
 * @param filePath - Path to local file
 */
export async function deleteLocalFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
    console.log(`✅ Deleted local file: ${filePath}`);
  } catch (error: any) {
    console.error(`⚠️ Error deleting local file ${filePath}:`, error.message);
  }
}
