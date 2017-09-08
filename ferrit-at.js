/* ferrit-at.js - Reads one users recent tweets and generates ferrit page with
multiple cards and a ferrit card page for each tweet. */

const Twit = require('twit')
const alphanumtwid = require('alphanumeric-twitter-id')
const child_process = require('child_process')
const qrcode = require('qrcode')
const config = require('config')
const fs = require('fs')
const handlebars = require('handlebars')

let my_url = config.get('general.my_url')

/* Sets up twitter authentiction from the config file. Put it in production.toml
and don't check that file into git. */
const T = new Twit( config.get('twitter') );

let screen_name = 'dril'
T.get('statuses/user_timeline', { screen_name: screen_name, count: 1 }, function(err, data, response) {
  if(!err) {
    data.forEach(function(element) {
      /* fcode is the twitter ID encoded to make it shorter */
      let fcode = alphanumtwid.encode(element['id'])
      genqr(fcode)
      .then((qrname) => genimage(fcode, element))
      .then(() => gencard(fcode, element))
      .then((partial) => gensinglepage(fcode, element, partial))
      .then((html) => console.log(html))
    })
  }
})

/* genqr(fcode)
Generates a qrcode image file based on the given fcode, returns the filename.
*/
const genqr = (fcode) => {
  return new Promise((resolve, reject) => {
    qrname='tmp/qr-' + fcode + '.png'
    qrcode.toFile(qrname, my_url + '/' + fcode, function(err) {
      if(err) {
        reject(err)
      }
      else {
        resolve(qrname)
      }
    })
  })
}

/* genimage(fcode, element)
genimage generates an image with the given details and returns a filename.
element is the result object from the twitter query. */
const genimage = (fcode, element) => {
  return new Promise((resolve, reject) => {
    /* Call out to a script that does the graphics magick work */
    child_process.exec("sh/make-image.sh '" + element['text'] + "' '" +
    element['user']['screen_name'] + "' '" + element['created_at'] + "' '" +
    fcode + "'", function(imgname, err) {
      if(err) {
        reject(err)
      }
      else {
        resolve(imgname)
      }
    })
  })
}

/* gencard(card_data)
Generates a card fragment, which can be used on the main page or on a single
card page. Receives a card_data object, and returns HTML for the card.
*/
const gencard = (fcode, element) => {
  card_data = {
    screen_name: element['user']['screen_name'],
    id: element['id_str'],
    fcode: fcode,
    text: element['text'],
    single_page: true
  }

  /* Synchronous, because I don't even care. */
  let html = fs.readFileSync('templates/partials/card.hbs', 'utf8')
  return (card_data, hbsToString(html, card_data))
}

const gensinglepage = (fcode, element, card_html) => {
  context = {
    screen_name: element['user']['screen_name'],
    id: element['id_str'],
    fcode: fcode,
    text: element['text'],
    card_html: card_html,
    single_page: 'yes'
  }
  let html = fs.readFileSync('templates/index_single.hbs', 'utf8')
  return (hbsToString(html, context))
}

/* hbsToString(html, context)
Combine handlebars template with data to make html */
const hbsToString = (html, context) => {
  let template = handlebars.compile(html)
  return template(context)
}
