const router=require("express").Router();
const authController=require("../controllers/authController");
const authMiddleware = require("../middleware/Auth");
const rateLimiter = require("../services/rateLimiter");
const { upload } = require("../services/s3");


router.get("/me",authMiddleware, authController.me);
router.post("/register",rateLimiter(60,50),upload.single('Avatar'),authController.register);
router.post("/login",rateLimiter(15,5),authController.login);
router.put("/user/update",rateLimiter(10,3), authMiddleware, upload.single('Avatar'), authController.update);

module.exports=router;