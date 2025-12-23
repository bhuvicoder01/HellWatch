const cloudinary=require('cloudinary')

cloudinary.config({ 
        cloud_name: 'dtzf3wpso', 
        api_key: '831429722246638', 
        api_secret: 'tvXMvfg4nsmmip3SxMqIt1Z9AXw' // Click 'View API Keys' above to copy your API secret
    });

module.exports=cloudinary