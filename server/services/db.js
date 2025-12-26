const mongoose=require('mongoose')


class MongoDB{
    static connect= async(uri)=>{
       return mongoose.connect(uri)
           .then(()=>{console.log(`MongoDB Connection Successful😎`)})
           .catch((error)=>{
            console.error(`Database connection failed😵 due to error:${error}`)
            MongoDB.connect(process.env.MONGODB_URI)
}
        )  
    }
}

module.exports=MongoDB;