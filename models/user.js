const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    email: String,
    fullname: String,
    state: String,
    img_url: String,
    img_id: String,
    password: String,
    timestamp: Number,
    city: String,
    country: String,
    is_online: {type: Boolean, default: false},
    last_login: {type: Number, default: 0},
    is_deleted: {type: Boolean, default: false},
    last_logout: {type: Number, default: 0},
}, {collection: 'users'});

const model = mongoose.model('User', userSchema);
module.exports = model;