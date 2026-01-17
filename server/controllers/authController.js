const audioModel = require("../models/Audio");
const userModel = require("../models/User");
const videoModel = require("../models/Videos");
const encrypt = require("../services/encrypt");

class authController{
    static async me(req,res){
        try {
            let user=req.user;
            if(!user){
                return res.status(400).json({message:"User not found"});
            }
            user.password=undefined;
            user.__v=undefined;
            res.json({user});
            
        } catch (error) {
            console.error(error);
            res.status(500).json({message:"Server error",error:error.message});
        }
    }

    static register=async(req,res)=>{
        try {
            const {username,password,email,isAdmin}=req.body;
            const existingUser=await userModel.findOne({$or:[{username:username},{email:email}]});
            if(existingUser){
                return res.status(400).json({message:"User already exists"});
            }
            const hashedPassword=await encrypt.hashPassword(password);
            const avatar=req.file
            const user=await userModel.create({username:username,password:hashedPassword,email,isAdmin,'avatar.url':avatar?.location, 'avatar.bucket': avatar?.bucket, 'avatar.key': avatar?.key});  
            res.json({user,message:"Registration successful"});
        } catch (error) {
            console.error(error);
            res.status(500).json({message:"Server error",error:error.message});
        }
    }
    static async login(req,res){
        try {
            const {email,password}=req.body;
            // console.log(email,password)
            const user=await userModel.findOne({email:email});
            if(!user){
                return  res.status(400).json({message:"Invalid credentials"});
            }
            const isMatch=await encrypt.comparePassword(password,user.password);
            // console.log(isMatch);
            if(!isMatch){
                return res.status(400).json({message:"Invalid credentials"});
            }
            let token=await encrypt.generateToken({id:user._id,username:user.username});
            res.cookie("token",token,{httpOnly:true});
            token=JSON.stringify(token);
            res.json({user:user, token:token, message:"Authentication successful"});
        } catch (error) {
            console.error(error);
            res.status(500).json({message:"Server error",error:error.message});
        }
    }
    static async logout(req, res){
        try {
            res.clearCookie("token");
            res.json({message:"Logout successful"});
        } catch (error) {
            console.error(error);
            res.status(500).json({message:"Server error", error:error.message});
        }
    }
    static async update(req, res){
        try {
            // let {username,password,email,isAdmin}=req.body;
            const user=req.user;
            // if(!username){
            //     username=user.username;
            // }
            // if(!password){
            //     password=user.password;
            // }
            // if(!email){
            //     email=user.email;
            // }
            // if(!isAdmin){
            //     isAdmin=user?.isAdmin;
            // }
            // if(!user){
            //     return res.status(400).json({message:"User not found"});
            // }
            //  let hashedPassword;
            // if(password){
            // hashedPassword=await encrypt.hashPassword(password);
            // }
            const avatar=req.file;
            // console.log(avatar);
            // if(username===user.username && password===user.password && email===user.email && isAdmin===user.isAdmin && avatar===user.avatar){
            //     return res.status(400).json({message:"No changes made"});
            // }
            const updatedUser=await userModel.findByIdAndUpdate(user._id, {avatar:{url:avatar?.location,bucket:avatar?.bucket,key:avatar?.key}}, {new:true});
            res.json({user:updatedUser, message:"Update successful"});
            await videoModel.updateMany({"owner.id": user._id}, {$set: {"owner.pic": avatar?.location}})
            await audioModel.updateMany({"owner.id": user._id}, {$set: {"owner.pic": avatar?.location}})
        } catch (error) {
            console.error(error);
            res.status(500).json({message:"Server error", error:error.message});
        }
    }
}
module.exports=authController;