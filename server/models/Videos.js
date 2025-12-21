const mongoose=require('mongoose')

const videoSchema=mongoose.Schema({

    key:String
},
{timestamps:true})

const videoModel=mongoose.model('videos',videoSchema)

module.exports=videoModel