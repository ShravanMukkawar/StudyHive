import React, { useState, useEffect } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateUser } from "../store/Slice.js";
import { User, Mail, Book, Building, Loader2, CheckCircle, PlusCircle, XCircle } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL;

function Profile() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [skills, setSkills] = useState([]);
    const [newSkill, setNewSkill] = useState("");
    const { register, handleSubmit, setValue } = useForm();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // const user =lo;
    const userid = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData"))._id : null;
    console.log("User ID", userid);
    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                if (!userid) {
                    setMessage("User not authenticated.");
                    return;
                }

                const response = await axios.get(`${apiUrl}/api/v1/users/profile`, {
                    headers: { Authorization: `Bearer ${"token"}` },
                    withCredentials: true,
                });

                const userData = response.data.data;
                if (userData) {
                    setValue("fullName", userData.fullName || "");
                    setValue("email", userData.email || "");
                    setValue("collegeName", userData.collegeName || "");
                    setValue("branch", userData.branch || "");
                    setValue("availability", userData.availability || "Available");
                    setSkills(userData.skills || []);
                }
            } catch (error) {
                console.error("Error fetching user details:", error);
                setMessage("Failed to fetch user details.");
            }
        };

        fetchUserDetails();
    }, [setValue]);

    const addSkill = () => {
        if (newSkill && !skills.includes(newSkill)) {
            setSkills([...skills, newSkill]);
            setNewSkill("");
        }
    };

    const removeSkill = (skillToRemove) => {
        setSkills(skills.filter(skill => skill !== skillToRemove));
    };

    const submit = async (data) => {
        setLoading(true);
        try {
            const updatedData = { ...data, skills };
            console.log("Data being submitted:", updatedData);

            const response = await axios.put(
                `${apiUrl}/api/v1/users/update-profile`,
                updatedData,
                {
                    headers: { Authorization: `Bearer ${"token"}` },
                    withCredentials: true,
                }
            );

            dispatch(updateUser(response.data.data));
            setMessage("Profile updated successfully!");
            navigate("/");
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage("Error updating profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
                        Update Your Profile
                    </h2>

                    <form onSubmit={handleSubmit(submit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name */}
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Enter your full name"
                                        className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                        {...register("fullName")}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                        {...register("email")}
                                    />
                                </div>
                            </div>

                            {/* College Name */}
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    College Name
                                </label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Enter your college name"
                                        className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                        {...register("collegeName")}
                                    />
                                </div>
                            </div>

                            {/* Branch */}
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Branch
                                </label>
                                <div className="relative">
                                    <Book className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Enter your branch"
                                        className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                        {...register("branch")}
                                    />
                                </div>
                            </div>

                            {/* Availability */}
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Availability
                                </label>
                                <div className="relative">
                                    <CheckCircle className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <select
                                        className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                        {...register("availability")}
                                    >
                                        <option value="Available">Available</option>
                                        <option value="Not Available">Not Available</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Skills Section */}
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">
                                Skills
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add a skill..."
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={addSkill}
                                    className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:scale-105"
                                >
                                    <PlusCircle />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-2">
                                {skills.map((skill, index) => (
                                    <div key={index} className="flex items-center bg-gray-200 px-3 py-1 rounded-lg">
                                        {skill}
                                        <button type="button" onClick={() => removeSkill(skill)}>
                                            <XCircle className="ml-2 text-red-500 w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-center pt-6">
                            <button type="submit" disabled={loading} className="bg-blue-500 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:scale-105">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Profile;
