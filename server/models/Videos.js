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
    stats:{
        views:{type:Number,default:0},
       likes:{type:Number,default:0},
       dislikes:{type:Number,default:0},
    },
    popularity:{
        type: Map,
        of: String,
        default: new Map()
    },
    qualities: {
        type: Map,
        of: String,
        default: new Map()
    },
    // isApproved:{
    //     type:Boolean,
    //     default:false
    // }
},
{timestamps:true})

const videoModel=mongoose.model('videos',videoSchema)

module.exports=videoModel