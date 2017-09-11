'use strict'

const md = require('markdown-it')()
const config = require('config')
const handlebars = require('handlebars')
const fs = require('fs-extra')
const path = require('path')

/* Fun time happy globals! */
let my_url = config.get('general.my_url')
let my_twitter = config.get('general.my_twitter')
let my_logo = config.get('general.my_logo')
let screen_names = (config.get('ferrits.screen_names'))
let hashtags = config.get('ferrits.hashtags')
let count = config.get('ferrits.count')
let dir = config.get('pages.path')

/* Find any files in md and turn them into HTML pages. Maybe one day will
be automatically indexed and added to a menu or something, but not now. */

async function process_md_files (dir, screen_name, hashtags) {
  fs.readdir(dir, function (err, files) {
    if (err) {
      throw err
    }

    files.map(function (file) {
      return path.join(dir, file)
    }).filter(function (file) {
      return fs.statSync(file).isFile()
    }).forEach(async function (file) {
      console.log("%s (%s)", file, path.extname(file))
      let mdout = fs.readFileSync(file, 'utf8')
      let html = await gen_content_page(md.render(mdout), screen_names, hashtags)
      let html_name = path.basename(file, '.md') + '.html'
      fs.writeFile(path.join('public/', html_name), html, (err) => {
        if (err) throw err
      })
    })
  })
}

async function gen_content_page(html_content, screen_names, hashtags) {
  let context = {
    screen_names: screen_names,
    hashtags: hashtags,
    html: html_content,
    my_logo: my_logo,
    my_url: my_url,
    my_twitter: my_twitter
  }
  let tmpl = fs.readFileSync('templates/content-page.hbs', 'utf8')
  let html = hbsToString(tmpl, context)
  return html
}

if(dir) {
  process_md_files(dir, screen_names, hashtags)
}

/* hbsToString(html, context)
Combine handlebars template with data to make html */
function hbsToString (html, context) {
  let template = handlebars.compile(html)
  return template(context)
}
