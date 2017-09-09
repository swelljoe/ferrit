"use strict"

/* ferrit.js - Reads recent tweets for users or hashtags and generates ferrit
index pages with multiple cards and a ferrit card page for each tweet. */

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
in twitter section and don't check that file into git. */
const T = new Twit( config.get('twitter') );

/* Fun time happy globals! */
let screen_names = config.get('ferrits.screen_names')
let hashtags = config.get('ferrits.hashtags')
let count = config.get('ferrits.count')

/* This is bloody awful. I'm still figuring out how async works in node */
async function main() {
  let best_user_tweets = await generate_user_pages()
  console.log(best_user_tweets)
  let best_hashtag_tweets = await generate_hashtag_pages()
  console.log(best_hashtag_tweets)
  let all_best_tweets = _.extend(best_user_tweets, best_hashtag_tweets)
  let html = await gen_index_page('index_hot', Object.values(all_best_tweets), screen_names, hashtags)
  writepage('', 'index', html)
  fs.copySync('assets/', 'public/assets/')
  console.log("Finished!")
}

async function generate_user_pages (screen_names, hashtags) {
  let best_user_tweets = {}
  for ( let screen_name of screen_names ) {
    T.get('statuses/user_timeline', { screen_name: screen_name, count: count }, function(err, statuses, response) {
      if(!err) {
        // Generates single tweet pages, figures out the best tweet by this user
        let fcodes = await ferrify_tweets(data, screen_name, false, screen_names, hashtags)
        let indexhtml = gen_index_page('index_user', fcodes, screen_name, screen_names, hashtags)
        writepage(screen_name + '/', 'index', indexhtml)
        let best_tweet = await get_best_tweet(data)
        if (best_tweet) {
          best_user_tweets[screen_name] = best_tweet /* hot */
        }
      }
      else {
        throw (err)
      }
    })
  }
  return (best_user_tweets)
}

/* same as above for hashtags. This is embarrasingly repeating myself */
async function generate_hashtag_pages (screen_names, hashtags) {
  let best_hashtag_tweets = {}
  for ( let hashtag of hashtags ) {
    T.get('search/tweets', { q: '#' + hashtag, count: count }, function(err, data, response) {
      if(!err) {
        let fcodes = await ferrify_tweets(data['statuses'], false, hashtag, screen_names, hashtags)
        let indexhtml = gen_index_page('index_hashtag', fcodes, hashtag, screen_names, hashtags)
        writepage('hashtags/' + hashtag + '/', 'index', indexhtml)
        let best_tweet = await get_best_tweet(data['statuses'])
        if (best_tweet) {
          best_hash_tweets[hashtag] = best_tweet
        }
      }
      else {
        throw (err)
      }
    })
  }
  return (best_hash_tweets)
}

// maakes a page for all tweets in data, returns list of fcodes for the index
async function ferrify_tweets(data, screen_name, hashtag, screen_names, hashtags) {
  data.forEach(function(element) {
    let (fcode, html) = gen_single_page(element, screen_names, hashtags)
    fcodes[fcode] = element['text']
  })
  return(fcodes)
}

// best_tweet(statuses)
// Return the most favorited tweet for this user or hashtag
async function get_best_tweet(statuses) {
  statuses.forEach(function(element) {
    let max = 0
    let fcode = alphanumtwid.encode(element['id'])
    if(max < element['favorite_count'] ) {
      max = element['favorite_count']
      best_tweet = fcode
    }
  })
  return best_tweet
}

/* genqr(fcode)
Generates a qrcode image file based on the given fcode, returns the filename.
*/
async function genqr (fcode) {
    qrname='tmp/qr-' + fcode + '.png'
    qrcode.toFile(qrname, my_url + '/' + fcode, function(err) {
    return(qrname)
  })
}

/* genimage(fcode, element)
genimage generates an image with the given details and returns a filename.
element is the result object from the twitter query. */
async function genimage (fcode, element) {
  fs.ensureDirSync('public/img')
  let text = element['text'].replace(/'/g, `’`)
  let screen_name = element['user']['screen_name']
  let created_at = element['created_at']
  /* Call out to a script that does the graphics magick work */
  child_process.exec("sh/make-image.sh '" + text + "' '" + screen_name
    + "' '" + created_at + "' '" + fcode + "'", function(imgname, err) {
    return(imgname)
  })
}

/* Generate a single page for one tweet. */
async function gen_single_page (fcode, element, screen_names, hashtags, hashtag) {
  /* fcode is the twitter ID encoded to make it shorter */
  let fcode = alphanumtwid.encode(element['id'])
  let qrname = await genqr(fcode)
  genimage(fcode, element))

  created_at = moment(element['created_at'], 'dd MMM DD HH:mm:ss ZZ YYYY').format('MM/DD/YYYY')
  context = {
    screen_name: element['user']['screen_name'],
    hashtag: hashtag,
    screen_names: screen_names,
    hashtags: hashtags,
    id: element['id_str'],
    created_at: created_at,
    fcode: fcode,
    text: element['text'],
    my_url: my_url,
    my_twitter: my_twitter,
    my_logo: my_logo
  }
  let tmpl = fs.readFileSync('templates/single.hbs', 'utf8')
  let html = hbsToString(tmpl, context)
  return (fcode, html)
}

/* hbsToString(html, context)
Combine handlebars template with data to make html */
async function hbsToString (html, context) {
  let template = handlebars.compile(html)
  return template(context)
}

/* writepage(path, filename, html)
Write a single ferrit page to disk. */
async function writepage (path, fname, html) {
  destpath = 'public/' + path
  fs.ensureDirSync(destpath)
  fs.writeFile(destpath + fname + '.html', html, (err) => {
    if(err) throw err
  })
}

/* Generate an index page for all tweets by one user. */
async function gen_index_page (template, fcodes, name, screen_names, hashtags) {
  context = {
    screen_name: screen_name,
    screen_names: screen_names,
    hashtags: hashtags,
    fcodes: fcodes,
    my_url: my_url,
    my_twitter: my_twitter,
    my_logo: my_logo
  }
  let html = fs.readFileSync('templates/' + template + '.hbs', 'utf8')
  return (hbsToString(html, context))
}

// escape single-quotes in strings
function escapeShellArg (arg) {
  string.replace(/\s+/g, " ") // Clean up extraneous spaces
  string.replace(/^\s+|\s+$/g, " ") // Chomp
  return string.replace(/'/g, `"'"`) // Unicode ' isn't special to shell
}

main()
