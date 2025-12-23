const jwt=require('jsonwebtoken')

async function authMiddleware(req,res,next){
    const token=req.headers.authorization?.split(" ")[1]
    if(!token){
        return res.status(401).json({message:"No token provided"})
    }
    try {
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        const userData={_id:decoded.id,username:decoded.username}
        const user=await userModel.findById(userData._id)
        req.user=user
        next()
    } catch (error) {
        return res.status(401).json({message:"Invalid token"})
    }
}

module.exports=authMiddleware;