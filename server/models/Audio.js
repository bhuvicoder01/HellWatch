const mongoose=require('mongoose');

const AudioSchema=new mongoose.Schema({
    owner: {
            id:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'users'
            },
            username:String,
            pic:String,
            email:String},
    key:String,
    title:String,
    artist:String,
    album:String,
    albumartist:String,
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