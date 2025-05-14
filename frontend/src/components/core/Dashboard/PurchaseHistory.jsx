import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getUserEnrolledCourses } from "../../../services/operations/profileAPI";
import Img from "../../common/Img";
import { Link } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";

export default function PurchaseHistory() {
  const { token } = useSelector((state) => state.auth);
  const [purchasedCourses, setPurchasedCourses] = useState(null);

  // Fetch all user's enrolled courses (purchased courses)
  const fetchPurchasedCourses = async () => {
    try {
      const res = await getUserEnrolledCourses(token);
      setPurchasedCourses(res);
    } catch (error) {
      console.log("Could not fetch purchase history");
    }
  };

  useEffect(() => {
    fetchPurchasedCourses();
  }, []);

  // Loading skeleton
  const skeletonItem = () => {
    return (
      <div className="flex border border-richblack-700 p-4 gap-x-4">
        <div className="h-14 w-14 rounded-lg skeleton"></div>
        <div className="flex flex-col flex-1">
          <div className="h-4 w-40 skeleton mb-2 rounded"></div>
          <div className="h-3 w-24 skeleton rounded"></div>
        </div>
        <div className="h-6 w-20 skeleton rounded self-center"></div>
      </div>
    );
  };

  // Return if no purchases
  if (purchasedCourses?.length === 0) {
    return (
      <div className="grid h-[50vh] w-full place-content-center text-center text-richblack-5 text-3xl">
        You haven&apos;t purchased any courses yet.
      </div>
    );
  }

  return (
    <>
      <div className="text-4xl text-richblack-5 font-boogaloo text-center sm:text-left">
        Purchase History
      </div>
      <div className="my-8 text-richblack-5">
        {/* Headings */}
        <div className="flex rounded-t-2xl bg-richblack-800 p-4">
          <p className="w-[50%]">Course Name</p>
          <p className="w-[15%] text-center">Category</p>
          <p className="w-[15%] text-center">Purchase Date</p>
          <p className="w-[10%] text-center">Amount</p>
          <p className="w-[10%] text-center">Status</p>
        </div>

        {/* Loading skeleton */}
        {!purchasedCourses && (
          <div>
            {skeletonItem()}
            {skeletonItem()}
            {skeletonItem()}
          </div>
        )}

        {/* Purchased courses */}
        {purchasedCourses?.map((course, i, arr) => (
          <div
            className={`flex items-center border border-richblack-700 p-4 ${
              i === arr.length - 1 ? "rounded-b-2xl" : "rounded-none"
            }`}
            key={i}
          >
            {/* Course info */}
            <div className="flex w-[50%] gap-4 items-center">
              <Img
                src={course.thumbnail}
                alt="course_img"
                className="h-14 w-14 rounded-lg object-cover"
              />
              <Link to={`/courses/${course._id}`}>
                <p className="font-semibold text-richblack-5 hover:text-yellow-50 transition-colors">
                  {course.courseName}
                </p>
              </Link>
            </div>
            
            {/* Category */}
            <div className="w-[15%] text-center">
              {course.category?.name || "N/A"}
            </div>
            
            {/* Purchase date */}
            <div className="w-[15%] text-center">
              {course.createdAt 
                ? new Date(course.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  }) 
                : "N/A"}
            </div>
            
            {/* Price */}
            <div className="w-[10%] text-center font-semibold">
              ₹{course.price}
            </div>

            {/* Payment status */}
            <div className="w-[10%] text-center">
              <div className="relative group">
                <FaCheckCircle 
                  className="text-yellow-50 mx-auto hover:text-yellow-100 cursor-pointer" 
                  size={20} 
                />
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-richblack-800 text-yellow-50 text-xs rounded p-2 w-28">
                  Payment successful
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-richblack-800"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
} 