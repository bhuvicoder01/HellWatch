const mongoose=require('mongoose')

const videoSchema=mongoose.Schema({
    owner: {type:mongoose.Schema.Types.ObjectId,ref:'users'},
    key:String,
    title:String,
    description:String,
    duration:String,
    genre:String,
    thumbnail:String,
},
{timestamps:true})

const videoModel=mongoose.model('videos',videoSchema)

module.exports=videoModel