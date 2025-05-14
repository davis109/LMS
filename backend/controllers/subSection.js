const Section = require('../models/section');
const SubSection = require('../models/subSection');
const { uploadImageToCloudinary } = require('../utils/imageUploader');



// ================ create SubSection ================
exports.createSubSection = async (req, res) => {
    try {
        // extract data
        const { title, description, sectionId } = req.body;
        console.log("Creating subsection with data:", { title, description, sectionId });
        console.log("Request files:", req.files);

        // validation for required fields
        if (!title || !description || !sectionId) {
            return res.status(400).json({
                success: false,
                message: 'Title, description, and section ID are required'
            });
        }

        // Define default values for video properties
        let videoUrl = "/assets/videos/default-lecture-video.mp4";
        let timeDuration = "00:00:10"; // Default 10 seconds
        
        // Check if video file is present
        const videoFile = req.files && req.files.video;
        
        if (videoFile) {
            try {
                console.log("Attempting to upload video to Cloudinary...");
                // Try to upload the video to Cloudinary
                const videoFileDetails = await uploadImageToCloudinary(videoFile, process.env.FOLDER_NAME);
                
                if (videoFileDetails && videoFileDetails.secure_url) {
                    videoUrl = videoFileDetails.secure_url;
                    timeDuration = videoFileDetails.duration || timeDuration;
                    console.log("Video uploaded successfully:", videoUrl);
                } else {
                    console.log("Video upload didn't return proper details, using default video");
                }
            } catch (error) {
                console.error("Error uploading video:", error);
                console.log("Using default video due to upload error");
            }
        } else {
            console.log("No video file provided, using default video");
        }

        // create entry in DB with either uploaded video or default
        const SubSectionDetails = await SubSection.create({
            title, 
            timeDuration, 
            description, 
            videoUrl
        });

        console.log("SubSection created:", SubSectionDetails._id);

        // link subsection id to section
        // Update the corresponding section with the newly created sub-section
        const updatedSection = await Section.findByIdAndUpdate(
            { _id: sectionId },
            { $push: { subSection: SubSectionDetails._id } },
            { new: true }
        ).populate("subSection");

        console.log("Section updated with new subsection");

        // return response
        res.status(200).json({
            success: true,
            data: updatedSection,
            message: 'SubSection created successfully'
        });
    }
    catch (error) {
        console.log('Error while creating SubSection');
        console.log(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while creating SubSection'
        });
    }
}



// ================ Update SubSection ================
exports.updateSubSection = async (req, res) => {
    try {
        const { sectionId, subSectionId, title, description } = req.body;
        console.log("Updating subsection:", { sectionId, subSectionId, title, description });
        console.log("Request files:", req.files);

        // validation
        if (!subSectionId) {
            return res.status(400).json({
                success: false,
                message: 'subSection ID is required to update'
            });
        }

        // find in DB
        const subSection = await SubSection.findById(subSectionId);

        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "SubSection not found",
            });
        }

        // add data
        if (title) {
            subSection.title = title;
        }

        if (description) {
            subSection.description = description;
        }

        // upload video to cloudinary if provided
        if (req.files && req.files.video) {
            try {
                console.log("Attempting to upload updated video to Cloudinary...");
                const video = req.files.video;
                const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
                
                if (uploadDetails && uploadDetails.secure_url) {
                    subSection.videoUrl = uploadDetails.secure_url;
                    subSection.timeDuration = uploadDetails.duration || subSection.timeDuration;
                    console.log("Updated video uploaded successfully:", uploadDetails.secure_url);
                } else {
                    console.log("Video upload didn't return proper details, keeping existing video");
                }
            } catch (error) {
                console.error("Error uploading updated video:", error);
                console.log("Keeping existing video due to upload error");
                // Keep existing video, no need to change anything
            }
        }

        // save data to DB
        await subSection.save();
        console.log("SubSection updated successfully");

        const updatedSection = await Section.findById(sectionId).populate("subSection");

        return res.json({
            success: true,
            data: updatedSection,
            message: "Section updated successfully",
        });
    }
    catch (error) {
        console.error('Error while updating the section');
        console.error(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "Error while updating the section",
        });
    }
}



// ================ Delete SubSection ================
exports.deleteSubSection = async (req, res) => {
    try {
        const { subSectionId, sectionId } = req.body
        await Section.findByIdAndUpdate(
            { _id: sectionId },
            {
                $pull: {
                    subSection: subSectionId,
                },
            }
        )

        // delete from DB
        const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })

        if (!subSection) {
            return res
                .status(404)
                .json({ success: false, message: "SubSection not found" })
        }

        const updatedSection = await Section.findById(sectionId).populate('subSection')

        // In frontned we have to take care - when subsection is deleted we are sending ,
        // only section data not full course details as we do in others 

        // success response
        return res.json({
            success: true,
            data: updatedSection,
            message: "SubSection deleted successfully",
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,

            error: error.message,
            message: "An error occurred while deleting the SubSection",
        })
    }
}