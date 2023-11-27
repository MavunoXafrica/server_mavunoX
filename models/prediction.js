const mongoose = require('mongoose');

const predictionSchema = mongoose.Schema({
    user_id: String,
    plant_name: String,
    harvest_date: String,
    planting_date: String,
    status: String,
    season: String,
    ph_level: Number,
    water_availability: Number,
    humidity: Number,
    temprature: Number,
    harvest_season: String,
    planting_season: String,
    exp_ph_min: Number,
    exp_ph_max: Number,
    exp_water_availability_min: Number,
    exp_water_availability_max: Number,
    exp_temp_min: Number,
    exp_temp_max: Number,
    timestamp: Number,
    is_deleted: {type: String, default: false}
}, {collection: 'predictions'});

const model = mongoose.model('Prediction', predictionSchema);
module.exports = model;