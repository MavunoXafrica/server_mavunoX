const express = require("express");
const jwt = require("jsonwebtoken");

const Prediction = require("../models/prediction");
const generateTimestamp = require("../functions/generateTimestamp")
const dateDifference = require("../functions/dateDifference");
const e = require("express");


const router = express.Router();

// endpoint to add prediction
router.post("/add_prediction", async (req, res) => {
  const { token, plant_name, harvest_date, planting_date, season, ph_level, water_availability, humidity, temprature, harvest_season, planting_season, exp_ph_min, exp_ph_max, exp_water_availability_min, exp_water_availability_max, exp_temp_min, exp_temp_max} = req.body;

  // check for required fields
  if (!token || !plant_name || !harvest_date || !planting_date || !season || !ph_level || !water_availability || !humidity || !temprature || !harvest_season || !planting_season || !exp_ph_min || !exp_ph_max || !exp_water_availability_max || !exp_water_availability_min || !exp_temp_max || !exp_temp_min) 
    return res.status(400).send({ status: "error", msg: "required fields must be filled" });
  
  try {
    // token verification
    const user = jwt.verify(token, process.env.JWT_SECRET);

    // calculate status
    const timestamp = Date.now();
    const harvest_datestamp = generateTimestamp(harvest_date);
    const planting_datestamp = generateTimestamp(planting_date);
    const current_difference = dateDifference(harvest_datestamp, timestamp);
    const main_differnce = dateDifference(harvest_datestamp, planting_datestamp);

    let status;
    if(current_difference <= 0) {
    status = "completed";
    } else if(current_difference >= main_differnce ) {
    status = "Upcoming";
    } else if(main_differnce > current_difference) {
    status = "In Progress";
    }

    // create prediction document
    let prediction = new Prediction();
    prediction.user_id = user._id;
    prediction.plant_name = plant_name;
    prediction.harvest_date = harvest_date;
    prediction.planting_date = planting_date;
    prediction.season = season;
    prediction.ph_level = ph_level;
    prediction.water_availability = water_availability;
    prediction.humidity = humidity;
    prediction.temprature = temprature;
    prediction.harvest_season = harvest_season;
    prediction.planting_season = planting_season;
    prediction.exp_ph_min = exp_ph_min;
    prediction.exp_ph_max = exp_ph_max;
    prediction.exp_water_availability_max = exp_water_availability_max;
    prediction.exp_water_availability_min = exp_water_availability_min;
    prediction.exp_temp_max = exp_temp_max;
    prediction.exp_temp_min = exp_temp_min;
    prediction.status = status;
    prediction.timestamp = timestamp;

    await prediction.save();

    return res.status(200).send({status: "ok", msg: "success", prediction});
  } catch (e) {
    console.error(e);
    // token verificaiton error
    if (e.name === 'JsonWebTokenError')
      return res.status(401).send({ status: "error", msg: "Token verification failed" });
    
    // internal server error
    return res.status(500).send({ status: "error", msg: "An error occured" });
  }
});

// endpoint to view predictions
router.post("/view_predictions", async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token) 
    return res.status(400).send({ status: "error", msg: "required fields must be filled" });
  

  try {
    // token verification
    const user = jwt.verify(token, process.env.JWT_SECRET);

    // fetch user document
    const predictions = await Prediction.find({user_id: user._id, is_deleted: false}, {plant_name: 1, harvest_date: 1, planting_date: 1, status: 1});

    // check if predictions where found
    if(predictions.length === 0)
      return res.status(200).send({status: "ok", msg: "no predictions found for this farmer", count: 0});

    const timestamp = Date.now();

    // calculate prediction
    for(let i = 0; i < predictions.length; i++) {
      // calculate status
      const harvest_datestamp = generateTimestamp(predictions[i].harvest_date);
      const planting_datestamp = generateTimestamp(predictions[i].planting_date);
      const current_difference = dateDifference(harvest_datestamp, timestamp);
      const main_differnce = dateDifference(harvest_datestamp, planting_datestamp);

      let status;
      if(current_difference <= 0) {
      status = "completed";
      } else if(current_difference >= main_differnce ) {
      status = "Upcoming";
      } else if(main_differnce > current_difference) {
      status = "In Progress";
      }

      predictions[i].status = status;
      await predictions[i].save();
    }

    return res.status(200).send({status: "ok", msg: "success", predictions, count: predictions.length});
  } catch (e) {
    console.error(e);
    // token verificaiton error
    if (e.name === 'JsonWebTokenError')
      return res.status(401).send({ status: "error", msg: "Token verification failed" });
    
    // internal server error
    return res.status(500).send({ status: "error", msg: "An error occured" });
  }
});

// endpoint to view single prediction
router.post("/view_single_prediction", async (req, res) => {
  const { token, prediction_id } = req.body;

  // check for required fields
  if (!token || !prediction_id) 
    return res.status(400).send({ status: "error", msg: "required fields must be filled" });
    
  try {
    // token verification
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch user document
    const prediction = await Prediction.findById({_id: prediction_id});

      // calculate status
      const timestamp = Date.now();
      const harvest_datestamp = generateTimestamp(prediction.harvest_date);
      const planting_datestamp = generateTimestamp(prediction.planting_date);
      const current_difference = dateDifference(harvest_datestamp, timestamp);
      const main_differnce = dateDifference(harvest_datestamp, planting_datestamp);

      let status;
      if(current_difference <= 0) {
      status = "completed";
      } else if(current_difference >= main_differnce ) {
      status = "Upcoming";
      } else if(main_differnce > current_difference) {
      status = "In Progress";
      }

      prediction.status = status;
      await prediction.save();

    return res.status(200).send({status: "ok", msg: "success", prediction});
  } catch (e) {
    console.error(e);
    // token verificaiton error
    if (e.name === 'JsonWebTokenError')
      return res.status(401).send({ status: "error", msg: "Token verification failed" });
    
    // internal server error
    return res.status(500).send({ status: "error", msg: "An error occured" });
  }
});

// delete prediction
router.post("/delete_prediction", async (req, res) => {
  const { token, prediction_id } = req.body;

  // check for required fields
  if (!token || !prediction_id) 
    return res.status(400).send({ status: "error", msg: "required fields must be filled" });
    
  try {
    // token verification
    jwt.verify(token, process.env.JWT_SECRET);

    // update user document
    await Prediction.findByIdAndUpdate({_id: prediction_id}, {is_deleted: true}).lean();

    return res.status(200).send({status: "ok", msg: "success"});
  } catch (e) {
    console.error(e);
    // token verificaiton error
    if (e.name === 'JsonWebTokenError')
      return res.status(401).send({ status: "error", msg: "Token verification failed" });
    
    // internal server error
    return res.status(500).send({ status: "error", msg: "An error occured" });
  }
});

module.exports = router;