const cloudinary = require('cloudinary').v2;

exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
    const options = { folder };
    if (height) options.height = height;
    if (quality) options.quality = quality;
    options.resource_type = 'auto';
    
    // Maximum number of retry attempts
    const MAX_RETRIES = 3;
    // Base delay between retries in milliseconds (will be multiplied by retry attempt number)
    const BASE_DELAY = 2000;
    
    let lastError = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`Uploading file to Cloudinary: ${file.name} to folder ${folder} (Attempt ${attempt}/${MAX_RETRIES})`);
            const result = await cloudinary.uploader.upload(file.tempFilePath, options);
            console.log(`Upload successful, generated URL: ${result.secure_url}`);
            return result;
        } catch (error) {
            lastError = error;
            console.error(`Upload attempt ${attempt} failed:`, error);
            
            // If we've reached max retries, throw the error
            if (attempt === MAX_RETRIES) {
                console.error("All upload attempts failed.");
                throw error;
            }
            
            // Calculate delay with exponential backoff
            const delay = BASE_DELAY * attempt;
            console.log(`Waiting ${delay}ms before retry ${attempt + 1}...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    // This should not be reached due to the throw in the loop,
    // but added as a fallback
    throw lastError;
}

// Function to delete a resource by public ID
exports.deleteResourceFromCloudinary = async (url) => {
    if (!url) return;

    try {
        const result = await cloudinary.uploader.destroy(url);
        console.log(`Deleted resource with public ID: ${url}`);
        console.log('Delete Resource result = ', result)
        return result;
    } catch (error) {
        console.error(`Error deleting resource with public ID ${url}:`, error);
        throw error;
    }
};