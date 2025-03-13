import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { Group } from "../models/studyGroup.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose, { mongo } from "mongoose";


const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        console.log(error?.message) 
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {

    const {fullName, email, username, password } = req.body

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.file?.path;
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        profilePic: avatar.url,
        email, 
        password,
        username
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const loginUser = asyncHandler(async (req, res) =>{

   try {
    const {email, password} = req.body

    if (!email) {
        throw new ApiError(400, "Email is required")
    }

    if(!password) {
        throw new ApiError(400, "Please enter password")
    }
    
    const user = await User.findOne({
        email: email
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'None'
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
   } catch (error) {
        throw new ApiError(500, error?.message)
   }

})

const logoutUser = asyncHandler(async(req, res) => {
    console.log("hi")
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'None'
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const getCurrentUser = asyncHandler(async(req, res) => {
    try {
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "Fetched current user !!"
            )
        )
    } catch (error) {
        throw new ApiError(500, error?.message)
    }
})


const getGroups = asyncHandler(async(req, res) => {
    try {
        const userId = req.user._id;
        console.log((userId))

        if(!userId) {
            throw new ApiError(400, "User does not exist")
        }

        const groups = await Group.find({
            members: {
                $in: [userId]
            }
        }).populate('leader','fullName')

        if(!groups){
            throw new ApiError(400, "Failed to find groups")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                groups,
                "Succesfully found groups"
            )
        )
    } catch (error) {   
        throw new ApiError(500, error?.message)
    }
})

const getLeaderInfo = asyncHandler(async(req, res) => {
    try {
        const {leaderId} = req.body

        if(!leaderId) {
            throw new ApiError(400, "No ID available")
        }

        const leader = await User.findById(leaderId).select('-password -refreshToken')

        if(!leader) {
            throw new ApiError(400, "No leader available")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                leader,
                "Succesfully sent data of leader "
            )
        )
    } catch (error) {
        throw new ApiError(500, "Server error :: " + error?.message)
    }
})
const profile = async (req, res) => {
    try {
        console.log("hi");
        const userId = req.user.id; // Assuming user ID is stored in req.user after authentication
        console.log("userID",userId)
        const user = await User.findById(userId).select('-password'); // Exclude password

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
const updateProfile = asyncHandler(async (req, res) => {
    try {
        console.log("hi");
        let updates = {};
        //console.log(req.body);
        // Updating basic details
        if (req.body.fullName) {
            updates.fullName = req.body.fullName;
        }
        if (req.body.email) {
            updates.email = req.body.email;
        }
        if (req.body.profilePic) {
            updates.profilePic = req.body.profilePic;
        }
        //console.log(req.data.collegeName);
        // Updating new fields
        if (req.body.branch) {
            updates.branch = req.body.branch;
        }
        if (req.body.collegeName) {
            updates.collegeName = req.body.collegeName;
        }
        // if (req.body.favouriteSubjects) {
        //     // Assuming favouriteSubjects is sent as a comma-separated string (e.g., "Math,Physics,Chemistry")
        //     updates.favouriteSubjects = req.body.favouriteSubjects.split(",");
        // }

        const updatedProfile = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true }
        );

        if (!updatedProfile) {
            throw new ApiError(400, "Profile could not be updated !!");
        }

        return res.status(200).json(
            new ApiResponse(200, updatedProfile, "Successfully updated profile !!")
        );
    } catch (error) {
        throw new ApiError(500, "Server error: " + error?.message);
    }
});

const search = async (req, res) => {
    try {
      const users = await User.find({}, "username branch collegeName profilePic"); // Fetch only required fields
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Server error" });
    }
  };

export {
    registerUser,
    logoutUser,
    refreshAccessToken,
    loginUser,
    getCurrentUser,
    getGroups,
    getLeaderInfo,
    updateProfile,
    profile,
    search
}