const express = require('express');
const router = express.Router();
const unirest = require('unirest');

/*ListenNotes set up*/
let result
unirest.get('https://listen-api.listennotes.com/api/v2/search?q=star%20wars&sort_by_date=0&type=episode&offset=0&len_min=10&len_max=30&genre_ids=68%2C82&published_before=1580172454000&published_after=0&only_in=title%2Cdescription&language=English&safe_mode=0')
  .header('X-ListenAPI-Key', '92deae50310140ab877e8f1d4e4c8fcd').then(response => {
    console.log("response from api",response.toJSON())
    result = response.toJSON()
  })

/* GET search page */
router.get('/listennotes', (req, res, next) => {
  res.render('listenNotes/search');
});

router.get('/listennotes/search-results', (req, res) => {
  console.log("HERE IS THE QUERY: " + req.query.podcast)
  unirest.get(`https://listen-api.listennotes.com/api/v2/search?q=${req.query.podcast}`)
    .header('X-ListenAPI-Key', '92deae50310140ab877e8f1d4e4c8fcd')
  .then((response) => {
    console.log("the response: " + response.toJSON().body.results)
    response.toJSON()
    res.render('listenNotes/search-results', {searchResults : response.toJSON().body.results})
  })
})

module.exports = router;
