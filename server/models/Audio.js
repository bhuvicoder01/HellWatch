const mongoose=require('mongoose');

const AudioSchema=new mongoose.Schema({
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users',
        required:true
    },
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
},{timestamps:true});
const audioModel=mongoose.model('Audio',AudioSchema);
module.exports=audioModel;