const userModel = require("../models/User")
const videoModel = require("../models/Videos")

class publicController{
    static getUser=async(req,res)=>{
        try {
            const {id}=req.query
            let user=await userModel.findOne({_id:id})
            user.password=undefined
            user.createdAt=undefined
            user.updatedAt=undefined
            user.__v=undefined
            if(user){
                res.status(200).json({user})
            }
            
        } catch (error) {
            res.status(500).json({error:error.message})
            
        }
    }


    static getUserVideos=async(req,res)=>{
        try {
            const {id}=req.query
            let videos=await videoModel.find({'owner.id':id})

             const formatted = videos.map(v => ({
          id: v._id,
          owner: v?.owner,
          title: v?.title,
          key: v.key,
          thumbnail: v.thumbnail,
          qualities: Object.fromEntries(v.qualities || new Map()),
          createdAt: v.createdAt
        }));
            if(videos){
                res.status(200).json({videos:formatted})
            }
            
        } catch (error) {
            console.log(error)
            res.status(500).json({error:error.message})
            
        }
    }
}
module.exports=publicController;