/* ferrit-at.js - Reads one users recent tweets and generates ferrit page with
multiple cards and a ferrit card page for each tweet. */

const Twit = require('twit')
const alphanumtwid = require('alphanumeric-twitter-id')
const child_process = require('child_process')
const qrcode = require('qrcode')
const config = require('config')
const fs = require('fs-extra')
const handlebars = require('handlebars')
const moment = require('moment')

let my_url = config.get('general.my_url')
let my_twitter = config.get('general.my_twitter')
let my_logo = config.get('general.my_logo')

/* Sets up twitter authentiction from the config file. Put it in production.toml
and don't check that file into git. */
const T = new Twit( config.get('twitter') );

/* Fun time happy globals! */
let screen_names = config.get('ferrits.screen_names')
let hashtags = config.get('ferrits.hashtags')
let count = config.get('ferrits.count')
let best_tweets = {}

fs.ensureDirSync('public/img')

/* This is bloody awful. I'm still figuring out how async works in node */
function main() {
  generate_user_pages()
  .then((best_tweets) => generate_hashtag_pages(best_tweets))
  .then((best_tweets) => gen_hot_index(best_tweets, screen_names, hashtags))
  .then((html) => writeroot(html))
  .catch((err) => console.log(err))
}

const generate_user_pages = () => {
  for ( let screen_name of screen_names ) {
    let fcodes = {}
    let max = 0
    let best_tweet
    fs.ensureDirSync('public/' + screen_name)
    T.get('statuses/user_timeline', { screen_name: screen_name, count: count }, function(err, data, response) {
      if(!err) {
        data.forEach(function(element) {
          /* fcode is the twitter ID encoded to make it shorter */
          let fcode = alphanumtwid.encode(element['id'])
          genqr(fcode)
          .then((qrname) => genimage(fcode, element))
          .then(() => gensinglepage(fcode, element, screen_names, hashtags))
          .then((html) => writepage(fcode, element, html))
          fcodes[fcode] = element['text']

          /* Find the hottest tweet by this user for the main index */
          if(max < element['favorite_count']) {
            max = element['favorite_count']
            best_tweet = fcode
          }
        })
        let indexhtml = genindexpage(fcodes, screen_name, screen_names, hashtags)
        writeindex(screen_name, indexhtml)
        fs.copySync('assets/', 'public/assets/')

        best_tweets[screen_name] = best_tweet /* hot */
        console.log(best_tweets)
      }
    })
    return new Promise((resolve, reject) => {
      console.log(best_tweets)
      resolve(best_tweets)
    })
  }
}

/* same as above for hashtags. This is embarrasingly repeating myself */
const generate_hashtag_pages = () => {
  for ( let hashtag of hashtags ) {
    let fcodes = {}
    let max = 0
    let best_tweet
    fs.ensureDirSync('public/hashtags/')
    T.get('search/tweets', { q: '#' + hashtag, count: count }, function(err, data, response) {
      if(!err) {
        data['statuses'].forEach(function(element) {
          /* fcode is the twitter ID encoded to make it shorter */
          let fcode = alphanumtwid.encode(element['id'])
          genqr(fcode)
          .then((qrname) => genimage(fcode, element))
          .then(() => gensinglepage(fcode, element, screen_names, hashtags))
          .then((html) => writepage(fcode, element, html))
          fcodes[fcode] = element['text']

          /* Find the hottest tweet by this user for the main index */
          if(max < element['favorite_count']) {
            max = element['favorite_count']
            best_tweet = fcode
          }
        })
        let indexhtml = gen_hashtag_index(fcodes, hashtag, screen_names, hashtags)
        write_hashtag_index(hashtag, indexhtml)

        best_tweets[hashtag] = best_tweet /* hot */
        console.log(best_tweets)
      }
    })
    return new Promise((resolve, reject) => {
      resolve(best_tweets)
    })
  }
}

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
  let text = element['text'].replace(/'/g, `’`)
  let screen_name = element['user']['screen_name']
  let created_at = element['created_at']
  return new Promise((resolve, reject) => {
    /* Call out to a script that does the graphics magick work */
    child_process.exec("sh/make-image.sh '" + text + "' '" + screen_name
      + "' '" + created_at + "' '" + fcode + "'", function(imgname, err) {
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
const gensinglepage = (fcode, element, screen_names) => {
  created_at = moment(element['created_at'], 'dd MMM DD HH:mm:ss ZZ YYYY').format('MM/DD/YYYY')
  context = {
    screen_name: element['user']['screen_name'],
    screen_names: screen_names,
    hashtags: hashtags,
    id: element['id_str'],
    created_at: created_at,
    fcode: fcode,
    text: element['text'],
    single_page: true,
    my_url: my_url,
    my_twitter: my_twitter,
    my_logo: my_logo
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
  destpath = 'public/'
  fs.ensureDirSync(destpath)
  fs.writeFile(destpath + fcode + '.html', html, (err) => {
    if(err) throw err
  })
}

/* Generate an index page for all tweets by one user. */
const genindexpage = (fcodes, screen_name, screen_names) => {
  context = {
    screen_name: screen_name,
    screen_names: screen_names,
    hashtags: hashtags,
    fcodes: fcodes,
    my_url: my_url,
    my_twitter: my_twitter,
    my_logo: my_logo
  }
  let html = fs.readFileSync('templates/index_user.hbs', 'utf8')
  return (hbsToString(html, context))
}

/* Generate an index page for all tweets by one user. */
const gen_hashtag_index = (fcodes, hashtag, screen_names, hashtags) => {
  context = {
    screen_names: screen_names,
    hashtags: hashtags,
    fcodes: fcodes,
    my_url: my_url,
    my_twitter: my_twitter,
    my_logo: my_logo
  }
  let html = fs.readFileSync('templates/index_hashtag.hbs', 'utf8')
  return (hbsToString(html, context))
}

/* hottest index page! XXX This is identical to previous func. */
const gen_hot_index = (best_tweets, screen_names, hashtags) => {
  context = {
    screen_names: screen_names,
    hashtags: hashtags,
    fcodes: best_tweets,
    my_url: my_url,
    my_twitter: my_twitter,
    my_logo: my_logo
  }
  console.log(best_tweets)
  return new Promise((resolve, reject) => {
    let templ = fs.readFileSync('templates/index_hot.hbs', 'utf8')
    let html = hbsToString(templ, context)
    resolve(html)
  })
}

/* writeindex(screen_name, html)
Write an index page for screen_name into file html. */
const writeindex = (screen_name, html) => {
  destpath = 'public/' + screen_name
  fs.ensureDirSync(destpath)
  fs.writeFile(destpath + '/index.html', html, (err) => {
    if(err) throw err
  })
}

/* writeroot(html) - the hot index at / */
const writeroot = (html) => {
  destpath = 'public/'
  fs.ensureDirSync(destpath)
  fs.writeFile(destpath + '/index.html', html, (err) => {
    if(err) throw err
  })
}

/* writeindex(screen_name, html)
Write an index page for screen_name into file html. */
const write_hashtag_index = (hashtag, html) => {
  return new Promise((resolve, reject) => {
    destpath = 'public/hashtags/' + hashtag
    fs.ensureDirSync(destpath)
    fs.writeFile(destpath + '/index.html', html, (err) => {
      if(err) { reject(err) }
      else { resolve() }
    })
  })
}

// escape single-quotes in strings
const escapeShellArg = (arg) => {
  // Sanitise all space (newlines etc.) to a single space
  string.replace(/\s+/g, " ")
  // Optionally remove leading and trailing space
  string.replace(/^\s+|\s+$/g, " ")
  // Quote with single quotes, escaping backslashes and single quotes
  return string.replace(/'/g, `"'"`)
}

main()
