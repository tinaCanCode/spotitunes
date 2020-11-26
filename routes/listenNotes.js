const express = require('express');
const router = express.Router();
const unirest = require('unirest');

/*ListenNotes set up*/
let result
unirest.get('https://listen-api.listennotes.com/api/v2/search?q=star%20wars&type=podcast')
  .header('X-ListenAPI-Key', '92deae50310140ab877e8f1d4e4c8fcd').then(response => {
    //console.log("response from api",response.toJSON())
    result = response.toJSON()
  })

/* GET search page */
router.get('/listennotes', (req, res, next) => {
  res.render('listenNotes/search');
});

router.get('/listennotes/search-results', (req, res) => {
  //console.log("HERE IS THE QUERY: " + req.query.podcast)
  unirest.get(`https://listen-api.listennotes.com/api/v2/search?q=${req.query.podcast}&type=podcast`)
    .header('X-ListenAPI-Key', '92deae50310140ab877e8f1d4e4c8fcd')
  .then((response) => {
    //console.log("the response: " + response.toJSON().body.results)
    response.toJSON()
    res.render('listenNotes/search-results', {searchResults : response.toJSON().body.results})
  })
})

router.post('/listennotes/:id/addtofavorite', (req, res) => {
  // create new object in database
  // push this ID to user "favorites" array
  console.log("THE PARAMS: " + req.params.id)
  // unirest.get(`https://listen-api.listennotes.com/api/v2/podcasts/${req.params.id}`)
  //   .header('X-ListenAPI-Key', '92deae50310140ab877e8f1d4e4c8fcd')
  // .then((response) => {
  //   //console.log("the response: " + response.toJSON().body.results)
  //   response.toJSON()
  //   res.render('listenNotes/search-results', {searchResults : response.toJSON().body.results})
  // })
})

module.exports = router;
