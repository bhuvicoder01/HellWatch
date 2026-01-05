const { getUser,getUserVideos } = require("../controllers/publicController");

const router=require("express").Router();


router.get('/user',getUser)
router.get('/user/videos', getUserVideos)

module.exports=router;