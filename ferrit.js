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
const _ = require('lodash')
const async = require('async')

const uncaught = require('uncaught');

uncaught.start();
uncaught.addListener(function (error) {
    console.log('Uncaught error or rejection: ', error.message);
});

let my_url = config.get('general.my_url')
let my_twitter = config.get('general.my_twitter')
let my_logo = config.get('general.my_logo')

/* Sets up twitter authentiction from the config file. Put it in production.toml
in twitter section and don't check that file into git. */
const T = new Twit( config.get('twitter') );

/* Fun time happy globals! */
let screen_names = _.shuffle(config.get('ferrits.screen_names'))
let hashtags = config.get('ferrits.hashtags')
let count = config.get('ferrits.count')

let best_user_tweets = {}
let best_hashtag_tweets = {}

/* This is bloody awful. I'm still figuring out how async works in node */
async function main() {
  Promise.all([
      generate_user_pages(screen_names, hashtags),
      generate_hashtag_pages(screen_names, hashtags)
  ]).then(function(results) {
    make_hot_index(results, screen_names, hashtags)
  })
}

async function make_hot_index(best_tweets, screen_names, hashtags) {
  let all_best_tweets = _.assignIn(best_tweets[0], best_tweets[1])
  all_best_tweets = _.pickBy(all_best_tweets, _.identity)
  let html = await gen_index_page('index_hot', all_best_tweets, 'hot', screen_names, hashtags)
  writepage('', 'index', html)
  fs.copySync('assets/', 'public/assets/')
  console.log("Finished!")
}

async function generate_user_pages (screen_names, hashtags) {
  for ( let screen_name of screen_names ) {
    try {
      const statuses = await get_statuses('statuses/user_timeline', { screen_name: screen_name, count: count })
      const fcodes = await get_fcodes(statuses)
      await ferrify_tweets(statuses, screen_name, false, screen_names, hashtags)
      let indexhtml = await gen_index_page('index_user', fcodes, screen_name, screen_names, hashtags)
      writepage(screen_name + '/', 'index', indexhtml)
      let best_tweet = await get_best_tweet(statuses)
      if (best_tweet) {
        best_user_tweets[best_tweet[0]] = best_tweet[1] /* hot */
      }
    }
    catch (err) {
      throw (err)
    }
  }
  return best_user_tweets
}

/* same as above for hashtags. This is embarrasingly repeating myself */
async function generate_hashtag_pages (screen_names, hashtags) {
  for ( let hashtag of hashtags ) {
    try {
      const data = await get_statuses('search/tweets', { q: '#' + hashtag, count: count })
      const statuses = data['statuses']
      const fcodes = await get_fcodes(data['statuses'])
      await ferrify_tweets(data['statuses'], false, hashtag, screen_names, hashtags)
      let indexhtml = await gen_index_page('index_hashtag', fcodes, hashtag, screen_names, hashtags)
      writepage('hashtags/' + hashtag + '/', 'index', indexhtml)
      let best_tweet = await get_best_tweet(data['statuses'])
      if (best_tweet) {
        best_hashtag_tweets[best_tweet[0]] = best_tweet[1]
      }
    }
    catch (err) {
      throw (err)
    }
  }
  return best_hashtag_tweets
}

async function get_statuses(endpoint, options) {
  return T.get(endpoint, options)
  .catch(function (err) {
    console.log('caught: ' + err.stack)
  })
  .then(function (result) {
    return (result.data)
  })
}

function get_fcodes(statuses) {
  let fcodes = {}
  async.each(statuses, function(element, callback) {
    let fcode = alphanumtwid.encode(element['id'])
    fcodes[fcode] = element['text']
  })
  return (fcodes)
}

// maakes a page for all tweets in data, returns list of fcodes for the index
async function ferrify_tweets(data, screen_name, hashtag, screen_names, hashtags) {
  let name = (screen_name || hashtag)
  console.log('  Generating ' + data.length + ' single tweet pages for ' + name)
  for (let element of data) {
      let fcode = alphanumtwid.encode(element['id'])
      let html = await gen_single_page(fcode, element, screen_names, hashtags, hashtag)
      writepage('', fcode, html)
  }
  return data
}

// best_tweet(statuses)
// Return the most favorited tweet for this user or hashtag
async function get_best_tweet(statuses) {
  let best_tweet
  let best_fcode
  statuses.forEach(function(element) {
    let max = 0
    let fcode = alphanumtwid.encode(element['id'])
    if(max < element['favorite_count'] ) {
      max = element['favorite_count']
      best_fcode = fcode
      best_tweet = element['text']
    }
  })
  return [best_fcode, best_tweet]
}

/* genqr(fcode)
Generates a qrcode image file based on the given fcode, returns the filename.
*/
async function genqr (fcode) {
    let qrname='tmp/qr-' + fcode + '.png'
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
  let qrname = await genqr(fcode)
  genimage(fcode, element)

  let created_at = moment(element['created_at'], 'dd MMM DD HH:mm:ss ZZ YYYY').format('MM/DD/YYYY')
  let shorttext = encodeURIComponent(trunc(element['text'], element['user']['screen_name']))
  let context = {
    screen_name: element['user']['screen_name'],
    hashtag: hashtag,
    screen_names: screen_names,
    hashtags: hashtags,
    id: element['id_str'],
    created_at: created_at,
    fcode: fcode,
    text: element['text'],
    shorttext: shorttext,
    my_url: my_url,
    my_twitter: my_twitter,
    my_logo: my_logo
  }
  let tmpl = fs.readFileSync('templates/single.hbs', 'utf8')
  let html = hbsToString(tmpl, context)
  return (html)
}

/* hbsToString(html, context)
Combine handlebars template with data to make html */
function hbsToString (html, context) {
  let template = handlebars.compile(html)
  return template(context)
}

/* writepage(path, filename, html)
Write a single ferrit page to disk. */
async function writepage (path, fname, html) {
  let destpath = 'public/' + path
  fs.ensureDirSync(destpath)
  fs.writeFile(destpath + fname + '.html', html, (err) => {
    if(err) throw err
  })
}

/* Generate an index page for all tweets by one user. */
async function gen_index_page (template, fcodes, name, screen_names, hashtags) {
  console.log('Beginning generation of index with ' + Object.keys(fcodes).length + ' items for ' + name)
  let context = {
    screen_name: name,
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

function trunc (text, screen_name) {
  let extra = (my_url + screen_name + 'http://"RT @ ...."').length
  if (text.length > 140-extra) {
    return ('"' + (text.substring(0,140-extra)).replace(/[\s+]$/, '') + '..."')
  }
  else {
    return ('"' + text + '"')
  }
}

main()
