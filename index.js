const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// init express
mongoose.connect(process.env.MONGO_URI);

const con = mongoose.connection;
con.on('open', error => {
    if(!error){
        console.log('DB connection successful');
    }else{
        console.log(`DB connection failed with error: ${error}`);
    }
});

const domainsFromEnv = process.env.CORS_DOMAINS || "";
const whitelist = domainsFromEnv.split(",").map(item => item.trim());
const corsOptions = {
    origin: (origin, callback) => {
        if(!origin || whitelist.indexOf(origin) !== -1){
            callback(null, true);
        }else{
            callback(new Error("Not Allowed by CORS"));
        }
    },
    credentials: true
}

app.use(cors(corsOptions));

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cookieParser());

// user routes
app.use('/auth', require('./routes/auth'));
app.use('/profile', require('./routes/profile'));
app.use('/prediction', require('./routes/prediction'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));