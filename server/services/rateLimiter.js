const {rateLimit}=require('express-rate-limit')

function rateLimiter (windowSize,maxRequests){
    return rateLimit({
        windowMs: windowSize * 60 * 1000, // Convert minutes to milliseconds
        max: maxRequests, // Limit each IP to maxRequests requests per window
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: true,
      })
}
module.exports=rateLimiter;