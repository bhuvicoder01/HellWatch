const userModel = require("../models/User");
const encrypt = require("../services/encrypt");

class authController{
    static async me(req,res){
        try {
            const user=req.user;
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
            const avatar=req.files?.avatar?.[0] ? {
                filename: req.files.avatar[0].filename,
                path: req.files.avatar[0].path,
                originalname: req.files.avatar[0].originalname
            } : null;
            const user=await userModel.create({username:username,password:hashedPassword,email,isAdmin,avatar});  
            res.json({user,message:"Registration successful"});
        } catch (error) {
            console.error(error);
            res.status(500).json({message:"Server error",error:error.message});
        }
    }
    static async login(req,res){
        try {
            const {email,password}=req.body;
            const user=await userModel.findOne({email:email});
            if(!user){
                return  res.status(400).json({message:"Invalid credentials"});
            }
            const isMatch=await encrypt.comparePassword(password,user.password);
            if(!isMatch){
                return res.status(400).json({message:"Invalid credentials"});
            }
            const token=await encrypt.generateToken({id:user._id,username:user.username});
            res.cookie("token",token,{httpOnly:true});
            res.json({user});
        } catch (error) {
            console.error(error);
            res.status(500).json({message:"Server error",error:error.message});
        }
    }
}
module.exports=authController;