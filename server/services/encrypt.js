const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')

const encrypt={
    hashPassword:async (password)=>{
        const salt=await bcrypt.genSalt(12);
        return await bcrypt.hash(password,salt);
    },
    comparePassword:async (password,hashPassword)=>{
        return await bcrypt.compare(password,hashPassword);
    },
    generateToken:async (payload)=>{
        return jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:'7d'});
    }
}
module.exports=encrypt;