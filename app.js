require('dotenv').config();

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const favicon = require('serve-favicon');
const hbs = require('hbs');
const mongoose = require('mongoose');
const logger = require('morgan');
const path = require('path');
const unirest = require('unirest');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

//require spotify Web api
const SpotifyWebApi = require('spotify-web-api-node');
// required setup for listennotes api

// const response = await unirest.get('https://listen-api.listennotes.com/api/v2/search?q=star%20wars&sort_by_date=0&type=episode&offset=0&len_min=10&len_max=30&genre_ids=68%2C82&published_before=1580172454000&published_after=0&only_in=title%2Cdescription&language=English&safe_mode=0')
// .header('X-ListenAPI-Key', process.env.LISTENNOTES_APIKEY)
// response.toJSON();

let result 
unirest.get('https://listen-api.listennotes.com/api/v2/search?q=star%20wars&sort_by_date=0&type=episode&offset=0&len_min=10&len_max=30&genre_ids=68%2C82&published_before=1580172454000&published_after=0&only_in=title%2Cdescription&language=English&safe_mode=0')
  .header('X-ListenAPI-Key', process.env.LISTENNOTES_APIKEY).then(response=>{
    //console.log("response from api",response.toJSON())
    result = response.toJSON()
  })
//response.toJSON();





mongoose
  .connect('mongodb://localhost/spotitunes', { useNewUrlParser: true })
  .then(x => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
  })
  .catch(err => {
    console.error('Error connecting to mongo', err)
  });

const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);

const app = express();

// Session Management
app.use(
  session({
    secret: 'doesnt-matter',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 * 60 }, // 1 hour
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      ttl: 60 * 60 * 24 // 60sec * 60min * 24h => 1 day
    })
  })
);

// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


// setting the spotify-api goes here:
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

// Retrieve an access token
spotifyApi
  .clientCredentialsGrant()
  .then(data => spotifyApi.setAccessToken(data.body['access_token']))
  .catch(error => console.log('Something went wrong when retrieving an access token', error));


// Express View engine setup

app.use(require('node-sass-middleware')({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  sourceMap: true
}));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
hbs.registerPartials(__dirname + "/views/partials");




// default value for title local
// app.locals.title = 'Spotitunes - Find all your favorite Podcasts in one App';
app.locals.title = 'Irontunes';



const index = require('./routes/index');
app.use('/', index);

const authRouter = require('./routes/auth');
app.use('/', authRouter);

const listenNotes = require("./routes/listenNotes");
app.use("/", listenNotes);

const spotify = require("./routes/spotify");
app.use("/spotify", spotify);

const podcasts = require("./routes/podcasts");
app.use("/", podcasts);

const playlist = require("./routes/playlists");
app.use("/", playlist);

module.exports = app;
