import { toast } from "react-hot-toast";
import { resetCart } from "../../slices/cartSlice";
import { setPaymentLoading } from "../../slices/courseSlice";
import { apiConnector } from "../apiConnector";
import { studentEndpoints } from "../apis";

// ================ buyCourse ================ 
export async function buyCourse(token, coursesId, userDetails, navigate, dispatch) {
    const toastId = toast.loading("Processing enrollment...");
    dispatch(setPaymentLoading(true));

    try {
        console.log("Enrolling in courses:", coursesId);
        
        // Call the enrollment endpoint
        const response = await apiConnector(
            "POST", 
            studentEndpoints.COURSE_VERIFY_API, 
            { coursesId }, 
            { 
                Authorization: `Bearer ${token}`,
            }
        );
        
        console.log("Enrollment response:", response);
        
        if (!response.data.success) {
            throw new Error(response.data.message);
        }
        
        toast.success("Successfully enrolled in the course!");
        navigate("/dashboard/enrolled-courses");
        dispatch(resetCart());
    }
    catch (error) {
        console.log("ENROLLMENT ERROR:", error);
        toast.error(error.message || "Could not enroll in the course");
    }
    finally {
        dispatch(setPaymentLoading(false));
        toast.dismiss(toastId);
    }
} 