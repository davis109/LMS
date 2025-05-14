// Test script for course creation
import { apiConnector } from '../../../../services/apiConnector';
import { courseEndpoints } from '../../../../services/apis';

const { CREATE_COURSE_API, COURSE_CATEGORIES_API } = courseEndpoints;

export const testCourseCreation = async (token) => {
  try {
    console.log("Running course creation test");
    
    // First, fetch a valid category ID
    console.log("Fetching categories...");
    const categoriesResponse = await apiConnector("GET", COURSE_CATEGORIES_API);
    console.log("Categories response:", categoriesResponse);
    
    if (!categoriesResponse?.data?.success || !categoriesResponse?.data?.data?.length) {
      throw new Error("No categories available. Cannot create a course without a category.");
    }
    
    // Get the first category ID from the response
    const categoryId = categoriesResponse.data.data[0]._id;
    console.log("Using category:", categoriesResponse.data.data[0].name, categoryId);
    
    const formData = new FormData();
    
    // Add minimal required fields
    formData.append("courseName", "Test Course");
    formData.append("courseDescription", "This is a test course");
    formData.append("category", categoryId);
    formData.append("status", "Draft");
    formData.append("tag", JSON.stringify(["test"]));
    formData.append("instructions", JSON.stringify(["test instruction"]));
    formData.append("price", "0");
    formData.append("whatYouWillLearn", "Test learning");
    
    // Create a simple file for testing
    const testBlob = new Blob(["test file content"], { type: "image/jpeg" });
    const testFile = new File([testBlob], "test-thumbnail.jpg", { type: "image/jpeg" });
    formData.append("thumbnailImage", testFile);
    
    console.log("Test form data created");
    
    const response = await apiConnector("POST", CREATE_COURSE_API, formData, {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    });
    
    console.log("Test course creation response:", response);
    return response;
  } catch (error) {
    console.error("Test course creation error:", error);
    return { error };
  }
};

// Function to check if categories are available
export const checkCategories = async () => {
  try {
    console.log("Checking categories...");
    const categoriesResponse = await apiConnector("GET", COURSE_CATEGORIES_API);
    console.log("Categories check response:", categoriesResponse);
    
    if (!categoriesResponse?.data?.success) {
      console.error("API returned error:", categoriesResponse?.data);
      return {
        success: false,
        message: categoriesResponse?.data?.message || "Could not fetch categories",
        data: null
      };
    }
    
    const categories = categoriesResponse.data.data;
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      console.warn("No categories found");
      return {
        success: false,
        message: "No categories found",
        data: null
      };
    }
    
    console.log("Categories available:", categories.map(c => c.name).join(", "));
    return {
      success: true,
      message: "Categories found",
      data: categories
    };
  } catch (error) {
    console.error("Error checking categories:", error);
    return {
      success: false,
      message: error.message || "Error checking categories",
      data: null
    };
  }
};

export default testCourseCreation; 