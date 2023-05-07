require('dotenv').config();
const path = require('path');
const express = require('express');
const compression = require('compression');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const expressHandlebars = require('express-handlebars');
const helmet = require('helmet');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');



const router = require('./router.js');
const port = process.env.PORT || process.env.NODE_PORT || 3000;

const {socketSetup} = require('./io.js');

const REDISCLOUD_URL = "redis://default:De9XRyxfngXbgFNh4T87lQxbqLRgQWFO@redis-14149.c44.us-east-1-2.ec2.cloud.redislabs.com:14149"
const dbURI = process.env.MONGODB_URI || 'mongodb+srv://nds5465:flOIq6iafe7Vnfwu@gandls.0sugxct.mongodb.net/SimpleModels?retryWrites=true&w=majority';
console.log(dbURI);
mongoose.connect(dbURI).catch((err) => {
    if(err){
        console.log('Could not Connect');
        throw err;
    }
});
console.log(REDISCLOUD_URL);
const redisClient = redis.createClient({
    url:REDISCLOUD_URL,
});
redisClient.on('error',err => console.log('Redis Client Error',err));
redisClient.connect().then(()=>{
    
const app = express();

app.use(helmet());
app.use('/assets',express.static(path.resolve(`${__dirname}/../hosted/`)));
app.use(favicon(`${__dirname}/../hosted/img/favicon.png`));
app.use(compression());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use(session({
    key: 'sessionid',
    store: new RedisStore({
        client: redisClient,
    }),
    secret: 'Domo Arigato',
    resave: false,
    saveUninitialized: false,
}));
app.engine('handlebars',expressHandlebars.engine({
    defaultLayout: '',
}));
app.set('view engine', 'handlebars')
app.set('views', `${__dirname}/../views`);
console.log(`${__dirname}/../views`);

router(app);

const server = socketSetup(app);

server.listen(port, (err) => {
    if (err) {
      throw err;
    }
    console.log(`Listening on port ${port}`);
  });
})
console.log(mongoose.connection.readyState);
