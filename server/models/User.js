const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    role: { type: String, enum: ['user','emp', 'admin'], default: 'user' },
    avatar: { 
        bucket: String,
        url: String,
        key: String
    },
    isActive:{
        type:Boolean,
        default:true
    }

}
,{ timestamps: true });

const userModel = mongoose.model('users', userSchema);

module.exports = userModel;