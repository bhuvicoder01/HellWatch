const mongoose=require('mongoose')

const videoSchema=mongoose.Schema({
    owner: {
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'users'
        },
        username:String,
        pic:String,
        email:String},
    views:Number,
    key:String,
    title:String,
    description:String,
    duration:String,
    genre:String,
    thumbnail:String,
    qualities: {
        type: Map,
        of: String,
        default: new Map()
    }
},
{timestamps:true})

const videoModel=mongoose.model('videos',videoSchema)

module.exports=videoModel