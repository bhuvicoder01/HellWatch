const mongoose=require('mongoose')


class MongoDB{
    static connect= async(uri)=>{
       return mongoose.connect(uri)
           .then(()=>{console.log(`MongoDB Connection Successful😎`)})
           .catch((error)=>{
            console.error(`Database connection failed😵 due to error:${error}`)
            setInterval(()=>MongoDB.connect(uri),5000)
}
        )  
    }
}

module.exports=MongoDB;