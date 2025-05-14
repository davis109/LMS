// sendOtp , signup , login ,  changePassword
const User = require('./../models/user');
const Profile = require('./../models/profile');
const optGenerator = require('otp-generator');
const OTP = require('../models/OTP')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cookie = require('cookie');
const mailSender = require('../utils/mailSender');
const otpTemplate = require('../mail/templates/emailVerificationTemplate');
const { passwordUpdated } = require("../mail/templates/passwordUpdate");

// ================ SEND-OTP For Email Verification ================
exports.sendOTP = async (req, res) => {
    try {
        // fetch email from re.body 
        const { email } = req.body;

        // check user already exist ?
        const checkUserPresent = await User.findOne({ email });

        // if exist then response
        if (checkUserPresent) {
            console.log('(when otp generate) User alreay registered')
            return res.status(401).json({
                success: false,
                message: 'User is Already Registered'
            })
        }

        // Skip OTP generation and verification
        const otp = "123456"; // Hardcoded OTP for all users
        
        const name = email.split('@')[0].split('.').map(part => part.replace(/\d+/g, '')).join(' ');
        console.log(name);

        // Create entry for otp in DB without sending email
        const otpBody = await OTP.create({ email, otp });

        // return response successfully
        res.status(200).json({
            success: true,
            otp,
            message: 'Otp set successfully'
        });
    }
    catch (error) {
        console.log('Error while generating Otp - ', error);
        res.status(200).json({
            success: false,
            message: 'Error while generating Otp',
            error: error.mesage
        });
    }
}


// ================ SIGNUP ================
exports.signup = async (req, res) => {
    try {
        // extract data 
        const { firstName, lastName, email, password, confirmPassword,
            accountType, contactNumber, otp } = req.body;

        // validation
        if (!firstName || !lastName || !email || !password || !confirmPassword || !accountType) {
            return res.status(401).json({
                success: false,
                message: 'All fields are required..!'
            });
        }

        // check both pass matches or not
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                messgae: 'passowrd & confirm password does not match, Please try again..!'
            });
        }

        // check user have registered already
        const checkUserAlreadyExits = await User.findOne({ email });

        // if yes ,then say to login
        if (checkUserAlreadyExits) {
            return res.status(400).json({
                success: false,
                message: 'User registered already, go to Login Page'
            });
        }

        // Skip OTP verification
        // hash - secure passoword
        let hashedPassword = await bcrypt.hash(password, 10);

        // additionDetails
        const profileDetails = await Profile.create({
            gender: null, dateOfBirth: null, about: null, contactNumber: null
        });

        let approved = "";
        approved === "Instructor" ? (approved = false) : (approved = true);

        // create entry in DB
        const userData = await User.create({
            firstName, lastName, email, password: hashedPassword, contactNumber,
            accountType: accountType, additionalDetails: profileDetails._id,
            approved: approved,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
        });

        // return success message
        res.status(200).json({
            success: true,
            message: 'User Registered Successfully'
        });
    }

    catch (error) {
        console.log('Error while registering user (signup)');
        console.log(error)
        res.status(401).json({
            success: false,
            error: error.message,
            messgae: 'User cannot be registered , Please try again..!'
        })
    }
}


// ================ LOGIN ================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // check user is registered and saved data in DB
        let user = await User.findOne({ email }).populate('additionalDetails');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'You are not registered with us'
            });
        }


        // comapare given password and saved password from DB
        if (await bcrypt.compare(password, user.password)) {
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType // This will help to check whether user have access to route, while authorzation
            };

            // Generate token 
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "24h",
            });

            user = user.toObject();
            user.token = token;
            user.password = undefined; // we have remove password from object, not DB


            // cookie
            const cookieOptions = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
                httpOnly: true
            }

            res.cookie('token', token, cookieOptions).status(200).json({
                success: true,
                user,
                token,
                message: 'User logged in successfully'
            });
        }
        // password not match
        else {
            return res.status(401).json({
                success: false,
                message: 'Password not matched'
            });
        }
    }

    catch (error) {
        console.log('Error while Login user');
        console.log(error);
        res.status(500).json({
            success: false,
            error: error.message,
            messgae: 'Error while Login user'
        })
    }
}


// ================ CHANGE PASSWORD ================
exports.changePassword = async (req, res) => {
    try {
        // extract data
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        // Check if user exists
        const user = await User.findById(req.user.id);
        
        // Validation
        if (!oldPassword || !newPassword || !confirmNewPassword) {
            return res.status(401).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        // Check oldPassword is correct or not
        if (!(await bcrypt.compare(oldPassword, user.password))) {
            return res.status(400).json({
                success: false,
                message: 'The old password is not valid'
            });
        }
        
        // Check newPassword and confirmNewPassword are the same
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: 'The password and confirm password does not match'
            });
        }
        
        // Hash the newPassword
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update the user's password
        user.password = hashedPassword;
        await user.save();
        
        try {
            await mailSender(
                user.email,
                "Password for your account has been updated",
                passwordUpdated(
                    user.email,
                    `Password updated successfully for ${user.firstName} ${user.lastName}`
                )
            );
        } catch (error) {
            console.error("Error while sending mail:", error);
            return res.status(500).json({
                success: false,
                message: "Error occurred while sending email",
                error: error.message,
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });
    }
    catch (error) {
        console.log('Error while change password');
        console.log(error);
        res.status(401).json({
            success: false,
            error: error.message,
            messgae: 'Error while change password'
        })
    }
}

// ================ Create Test User ================
exports.createTestUser = async (req, res) => {
    try {
        // Check if test user already exists
        const testUserEmail = "testuser@example.com";
        const existingUser = await User.findOne({ email: testUserEmail });
        
        if (existingUser) {
            return res.status(200).json({
                success: true,
                message: "Test user already exists",
                testUser: {
                    email: testUserEmail,
                    password: "password123"
                }
            });
        }
        
        // Create test user if not exists
        const hashedPassword = await bcrypt.hash("password123", 10);
        
        // Create profile details
        const profileDetails = await Profile.create({
            gender: "Male", 
            dateOfBirth: new Date("1990-01-01"), 
            about: "This is a test user account", 
            contactNumber: "9876543210"
        });
        
        // Create user
        const userData = await User.create({
            firstName: "Test", 
            lastName: "User",
            email: testUserEmail,
            password: hashedPassword,
            contactNumber: "9876543210",
            accountType: "Student",
            additionalDetails: profileDetails._id,
            approved: true,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=Test User`
        });
        
        return res.status(200).json({
            success: true,
            message: "Test user created successfully",
            testUser: {
                email: testUserEmail,
                password: "password123" 
            }
        });
    }
    catch (error) {
        console.log('Error creating test user:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error creating test user'
        });
    }
}

// ================ Get All Users ================
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'email firstName lastName accountType');
        
        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            users: users
        });
    }
    catch (error) {
        console.log('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error fetching users'
        });
    }
}