import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "react-hot-toast"
import { HiOutlineCurrencyRupee } from "react-icons/hi"
import { MdNavigateNext } from "react-icons/md"
import { useDispatch, useSelector } from "react-redux"

import { addCourseDetails, editCourseDetails, fetchCourseCategories } from "../../../../../services/operations/courseDetailsAPI"
import { setCourse, setStep } from "../../../../../slices/courseSlice"
import { COURSE_STATUS } from "../../../../../utils/constants"
import IconBtn from "../../../../common/IconBtn"
import Upload from "../Upload"
import ChipInput from "./ChipInput"
import RequirementsField from "./RequirementField"
import { testCourseCreation, checkCategories } from "../testCourseCreation"

export default function CourseInformationForm() {

  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm()

  const dispatch = useDispatch()
  const { token } = useSelector((state) => state.auth)
  const { course, editCourse } = useSelector((state) => state.course)
  const [loading, setLoading] = useState(false)
  const [courseCategories, setCourseCategories] = useState([])

  useEffect(() => {
    const getCategories = async () => {
      setLoading(true)
      try {
        const categories = await fetchCourseCategories();
        console.log("Fetched categories:", categories)
        if (categories && categories.length > 0) {
          console.log("Setting categories:", categories)
          setCourseCategories(categories)
        } else {
          console.warn("No categories found or empty array")
          toast.error("No course categories available")
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
        toast.error("Failed to load categories")
      }
      setLoading(false)
    }
    
    // if form is in edit mode 
    getCategories()
    
    if (editCourse) {
      // console.log("editCourse ", editCourse)
      setValue("courseTitle", course.courseName)
      setValue("courseShortDesc", course.courseDescription)
      setValue("coursePrice", course.price)
      setValue("courseTags", course.tag)
      setValue("courseBenefits", course.whatYouWillLearn)
      setValue("courseCategory", course.category)
      setValue("courseRequirements", course.instructions)
      setValue("courseImage", course.thumbnail)
    }
  }, [])



  const isFormUpdated = () => {
    const currentValues = getValues()
    // console.log("changes after editing form values:", currentValues)
    if (
      currentValues.courseTitle !== course.courseName ||
      currentValues.courseShortDesc !== course.courseDescription ||
      currentValues.coursePrice !== course.price ||
      currentValues.courseTags.toString() !== course.tag.toString() ||
      currentValues.courseBenefits !== course.whatYouWillLearn ||
      currentValues.courseCategory._id !== course.category._id ||
      currentValues.courseRequirements.toString() !== course.instructions.toString() ||
      currentValues.courseImage !== course.thumbnail) {
      return true
    }
    return false
  }

  //   handle next button click
  const onSubmit = async (data) => {
    console.log("Form data submitted:", data)

    if (editCourse) {
      // const currentValues = getValues()
      // console.log("changes after editing form values:", currentValues)
      // console.log("now course:", course)
      // console.log("Has Form Changed:", isFormUpdated())
      if (isFormUpdated()) {
        const currentValues = getValues()
        const formData = new FormData()
        // console.log('data -> ',data)
        formData.append("courseId", course._id)
        if (currentValues.courseTitle !== course.courseName) {
          formData.append("courseName", data.courseTitle)
        }
        if (currentValues.courseShortDesc !== course.courseDescription) {
          formData.append("courseDescription", data.courseShortDesc)
        }
        if (currentValues.coursePrice !== course.price) {
          formData.append("price", data.coursePrice || 0)
        }
        if (currentValues.courseTags && course.tag && currentValues.courseTags.toString() !== course.tag.toString()) {
          formData.append("tag", JSON.stringify(data.courseTags || []))
        }
        if (currentValues.courseBenefits !== course.whatYouWillLearn) {
          formData.append("whatYouWillLearn", data.courseBenefits || "")
        }
        if (currentValues.courseCategory?._id !== course.category?._id) {
          formData.append("category", data.courseCategory)
        }
        if (currentValues.courseRequirements && course.instructions && currentValues.courseRequirements.toString() !== course.instructions.toString()) {
          formData.append("instructions", JSON.stringify(data.courseRequirements || []))
        }
        if (currentValues.courseImage !== course.thumbnail) {
          formData.append("thumbnailImage", data.courseImage)
        }

        // send data to backend
        setLoading(true)
        const result = await editCourseDetails(formData, token)
        setLoading(false)
        if (result) {
          dispatch(setStep(2))
          dispatch(setCourse(result))
        }
      } else {
        toast.error("No changes made to the form")
      }
      return
    }

    // user has visited first time to step 1
    console.log("Creating new course with data:", data)
    
    // Check if required fields are present
    if (!data.courseTitle || !data.courseShortDesc || !data.courseCategory || !data.courseImage) {
      toast.error("Required fields are missing: title, description, category, or thumbnail")
      console.error("Missing required fields:", {
        title: !data.courseTitle,
        description: !data.courseShortDesc,
        category: !data.courseCategory,
        image: !data.courseImage
      })
      return
    }
    
    const formData = new FormData()
    formData.append("courseName", data.courseTitle)
    formData.append("courseDescription", data.courseShortDesc)
    formData.append("price", data.coursePrice || 0)
    
    // Handle tag data
    try {
      const tagData = data.courseTags || []
      console.log("Tag data:", tagData)
      formData.append("tag", JSON.stringify(tagData))
    } catch (err) {
      console.error("Error processing tags:", err)
      formData.append("tag", JSON.stringify([]))
    }
    
    formData.append("whatYouWillLearn", data.courseBenefits || "")
    formData.append("category", data.courseCategory)
    formData.append("status", COURSE_STATUS.DRAFT)
    
    // Handle requirements data
    try {
      const requirementsData = data.courseRequirements || []
      console.log("Requirements data:", requirementsData)
      formData.append("instructions", JSON.stringify(requirementsData))
    } catch (err) {
      console.error("Error processing requirements:", err)
      formData.append("instructions", JSON.stringify([]))
    }
    
    formData.append("thumbnailImage", data.courseImage)
    
    // Log form data for debugging
    console.log("FORM DATA ENTRIES:")
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1])
    }
    
    setLoading(true)
    try {
      const result = await addCourseDetails(formData, token)
      console.log("Course creation result:", result)
      if (result) {
        dispatch(setStep(2))
        dispatch(setCourse(result))
      } else {
        toast.error("Failed to create course. See console for details.")
      }
    } catch (error) {
      console.error("Error creating course:", error)
      toast.error("Error creating course: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 rounded-md border-[1px] border-richblack-700 bg-richblack-800 p-6 "
    >
      {/* Course Title */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-richblack-5" htmlFor="courseTitle">
          Course Title
        </label>
        <input
          id="courseTitle"
          placeholder="Enter Course Title"
          {...register("courseTitle")}
          className="form-style w-full"
        />
        {errors.courseTitle && (
          <span className="ml-2 text-xs tracking-wide text-pink-200">
            Course title is required
          </span>
        )}
      </div>

      {/* Course Short Description */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-richblack-5" htmlFor="courseShortDesc">
          Course Short Description
        </label>
        <textarea
          id="courseShortDesc"
          placeholder="Enter Description"
          {...register("courseShortDesc")}
          className="form-style resize-x-none min-h-[130px] w-full ] "
        />
        {errors.courseShortDesc && (
          <span className="ml-2 text-xs tracking-wide text-pink-200">
            Course Description is required
          </span>
        )}
      </div>

      {/* Course Price */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-richblack-5" htmlFor="coursePrice">
          Course Price
        </label>
        <div className="relative">
          <input
            id="coursePrice"
            placeholder="Enter Course Price"
            {...register("coursePrice", {
              valueAsNumber: true,
              pattern: {
                value: /^(0|[1-9]\d*)(\.\d+)?$/,
              },
            })}
            className="form-style w-full !pl-12"

          />
          <HiOutlineCurrencyRupee className="absolute left-3 top-1/2 inline-block -translate-y-1/2 text-2xl text-richblack-400" />
        </div>
        {errors.coursePrice && (
          <span className="ml-2 text-xs tracking-wide text-pink-200">
            Course Price is required
          </span>
        )}
      </div>

      {/* Course Category */}
      <div className="flex flex-col space-y-2 ">
        <div className="flex items-center justify-between">
          <label className="text-sm text-richblack-5" htmlFor="courseCategory">
            Course Category {loading && "(Loading...)"}
          </label>
          <button
            type="button"
            onClick={async () => {
              setLoading(true)
              try {
                const result = await checkCategories()
                if (result.success) {
                  toast.success(`Found ${result.data.length} categories: ${result.data.map(c => c.name).join(", ")}`)
                  setCourseCategories(result.data)
                } else {
                  toast.error(result.message)
                }
              } catch (error) {
                console.error("Error checking categories:", error)
                toast.error("Error checking categories")
              } finally {
                setLoading(false)
              }
            }}
            className="text-sm text-yellow-50 underline"
          >
            Refresh Categories
          </button>
        </div>
        <select
          {...register("courseCategory", { required: true })}
          defaultValue=""
          id="courseCategory"
          className="form-style w-full cursor-pointer"
        >
          <option value="" disabled>
            Choose a Category
          </option>
          {courseCategories && courseCategories.length > 0 ? (
            courseCategories.map((category, indx) => (
              <option key={indx} value={category?._id}>
                {category?.name}
              </option>
            ))
          ) : (
            <option value="" disabled>
              No categories available
            </option>
          )}
        </select>
        {errors.courseCategory && (
          <span className="ml-2 text-xs tracking-wide text-pink-200">
            Course Category is required
          </span>
        )}
      </div>

      {/* Course Tags */}
      <ChipInput
        label="Tags"
        name="courseTags"
        placeholder="Enter Tags and press Enter or Comma"
        register={register}
        errors={errors}
        setValue={setValue}
      />

      {/* Course Thumbnail Image */}
      <Upload
        name="courseImage"
        label="Course Thumbnail"
        register={register}
        setValue={setValue}
        errors={errors}
        editData={editCourse ? course?.thumbnail : null}
      />

      {/* Benefits of the course */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-richblack-5" htmlFor="courseBenefits">
          Benefits of the course
        </label>
        <textarea
          id="courseBenefits"
          placeholder="Enter benefits of the course"
          {...register("courseBenefits")}
          className="form-style resize-x-none min-h-[130px] w-full"
        />
        {errors.courseBenefits && (
          <span className="ml-2 text-xs tracking-wide text-pink-200">
            Benefits of the course is required
          </span>
        )}
      </div>

      {/* Requirements/Instructions */}
      <RequirementsField
        name="courseRequirements"
        label="Requirements/Instructions"
        register={register}
        setValue={setValue}
        errors={errors}
      />

      {/* Add test button to help diagnose course creation */}
      {!editCourse && (
        <div className="flex justify-end gap-x-2 mt-4 border-t pt-4 border-richblack-700">
          <button
            type="button"
            onClick={async () => {
              const categoryValue = getValues("courseCategory");
              if (!categoryValue) {
                toast.error("Please select a category first");
                return;
              }
              
              setLoading(true);
              try {
                const testData = await testCourseCreation(token);
                console.log("Test course creation result:", testData);
                
                if (testData?.data?.success) {
                  toast.success("Test course creation successful!");
                  
                  // Use the test course data to continue
                  dispatch(setStep(2));
                  dispatch(setCourse(testData.data.data));
                } else {
                  toast.error("Test course creation failed: " + 
                    (testData?.error?.message || testData?.data?.message || "Unknown error"));
                }
              } catch (error) {
                console.error("Error in test course creation:", error);
                toast.error("Test failed: " + error.message);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="rounded-md bg-yellow-50 py-[8px] px-[20px] font-semibold text-richblack-900"
          >
            Test Course Creation
          </button>
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-end gap-x-2">
        {editCourse && (
          <button
            onClick={() => dispatch(setStep(2))}
            disabled={loading}
            className={`flex cursor-pointer items-center gap-x-2 rounded-md py-[8px] px-[20px] font-semibold
              text-richblack-900 bg-richblack-300 hover:bg-richblack-900 hover:text-richblack-300 duration-300`}
          >
            Continue Wihout Saving
          </button>
        )}
        <IconBtn
          disabled={loading}
          text={!editCourse ? "Next" : "Save Changes"}
        >
          <MdNavigateNext />
        </IconBtn>
      </div>
    </form>
  )
}


