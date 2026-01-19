const router=require("express").Router();
const authController=require("../controllers/authController");
const authMiddleware = require("../middleware/Auth");
const rateLimiter = require("../services/rateLimiter");
const { upload } = require("../services/s3");


router.get("/me",authMiddleware, authController.me);
router.post("/register",upload.single('Avatar'),authController.register);
router.post("/login",authController.login);
router.put("/user/update",authMiddleware, upload.single('Avatar'), authController.update);

module.exports=router;