/* ferrit-at.js - Reads one users recent tweets and generates ferrit page with
multiple cards and a ferrit card page for each tweet. */

const Twit = require('twit')
const alphanumtwid = require('alphanumeric-twitter-id')
const child_process = require('child_process')
const qrcode = require('qrcode')
const config = require('config')
const fs = require('fs')
const handlebars = require('handlebars')
const moment = require('moment')

let my_url = config.get('general.my_url')
let my_twitter = config.get('general.my_twitter')

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
      .then(() => gensinglepage(fcode, element))
      .then((html) => writepage(fcode, element, html))
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

/* Generate a single page for one tweet. */
const gensinglepage = (fcode, element) => {
  created_at = moment(element['created_at'], 'dd MMM DD HH:mm:ss ZZ YYYY').format('MM/DD/YYYY')
  context = {
    screen_name: element['user']['screen_name'],
    id: element['id_str'],
    created_at: created_at,
    fcode: fcode,
    text: element['text'],
    single_page: true,
    my_url: my_url,
    my_twitter: my_twitter
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

/* writepage(fcode, element, html)
Write a single ferrit page to disk. */
const writepage = (fcode, element, html) => {
  destpath = 'public/' + element['user']['screen_name'] + '/'
  fs.stat(destpath, (err) => {
    if (err) {
      /* doesn't exist, create it */
      fs.mkdirSync(destpath, (err) => { if(err) throw err })
    }
  })
  fs.writeFile(destpath + fcode + '.html', html, (err) => {
    if(err) throw err
  })
}
