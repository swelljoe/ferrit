# WTF is this?

Ferrit is a parody of another funny website, with less neoliberal propaganda and more fart jokes.

# Why is this?

I tweeted last week that I figured that other site took about 150 lines of code to build, and I wondered how much they spent on it, since they seemed inordinately proud of it.

Then, I happened to have a free weekend ahead of me, and an urge to learn Node.js, so I decided to see if it really could be done in 150 LoC (it took ~250, not counting HTML templates).

Mostly though, I just thought it was important to our democracy for there to be a [Verrit for @dril tweets](http://ferrit.us/dril). And, now there is.

The source code is available, so you can make your own. The code is awful (again, I just started learning Node when I started building this three days ago, but it works).

# It's not just like that other site though, right?

Right. That other site is stupid and pointless. Ferrit is, too, but in hopefully slightly funnier ways.

Differences:

  - Not built on WordPress. It's just a static site generator in Node. The site can be hosted anywhere on any old shared hosting or free hosting account, and it can be generated anywhere you have Node.JS, bash, and Graphics Magick installed.
  - Missing a few features. I don't plan to implement much more, but I will make images and article summaries for links work at some point.
  - No links to authoritative sources. Ferrit is about tweets, because all tweets are true. The ferrit authentication code proves it. Ferrit links to the authoritative tweet.

Sames:

  - Authentication codes! (And, also QR codes, because they're also dumb.)
  - Slick design. though I'm not using any of their resources, as that seemed like cheating. I rebuilt it from scratch in Inkscape and using the awesome Picnic CSS microframework. But, it's inspired by their design, so it's pretty similar, but not identical. Visual design may be the one thing they did OK on.
  - It's pointless and will probably be dead in a month.

# Really, what's the deal with authentication codes?

The best thing about Verrit is the authentication codes. They're ridiculous. I imagine the meeting where they sat around brainstorming how to get people to see these images (which surely will be shared as widely as "Obama is the anti-Christ" memes) and then check out the facts behind them. It's literally amazing to me that this is what they came up with.

So, I made ferrit authentication codes longer and harder to type.

I added QRCodes because that's just as dumb and involves smart phones.

# Philosophically...

Once I'd implemented the MVP feature of generating a "Verrit for @dril tweets", I realized it'd be very easy to make it work for any number of users or hashtags or whataver query terms I wanted. So, I expanded it to work with any number of tweeters. ferrit.us has some of my favorites, which you can see by clicking the users button at the top right.

Also, I think maybe ferrit is kinda what Verrit would be if it were made by folks who like democracy (i.e., it'd still be pointless and dumb, but at least it'd have a variety of views). Realistically though, Verrit for people who like democracy would probably look like an ideal reddit/twitter/wikipedia (without the Nazis), rather than either ferrit or Verrit.

# Copyright or whatever?

Ferrit is a parody, it is educational (open source, and I'll blog about it or some shit soon), and it is criticism. It checks all the major boxes for fair use, AFAICT.

If Verrit isn't dead in a month or two and if I want to keep doing something with Ferrit, I'll do a re-design. But, for now, it serves its purpose.

# Where's the source and stuff?

[Github](https://github.com/swelljoe/ferrit)

It is Apache licensed, so you can steal liberally from it, but I wouldn't recommend it. The code is really a mess.
