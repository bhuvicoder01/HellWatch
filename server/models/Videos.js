const mongoose=require('mongoose')

const videoSchema=mongoose.Schema({

    key:String,
    thumbnail:String,
    title:String,
    description:String,
    duration:String,
    genre:String
},
{timestamps:true})

const videoModel=mongoose.model('videos',videoSchema)

module.exports=videoModel