const router=require("express").Router();
const authController=require("../controllers/authController");
const authMiddleware = require("../middleware/Auth");
const { upload } = require("../services/s3");


router.get("/me",authMiddleware, authController.me);
router.post("/register",upload.single('Avatar'),authController.register);
router.post("/login",authController.login);

module.exports=router;