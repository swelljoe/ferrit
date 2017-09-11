# ferrit
Ferrit!

# Install dependencies

You'll need node (I developed on 8.4.0, and used some newish features), Graphics Magick in your path (the `gm` command), and the `bash` shell (there is a small bash helper program in `sh` to generate the images using `gm`).

# Create a production.toml

Copy `config/default.toml` to `config/production.toml`, edit it to include your Twitter keys, and change `screen_names` and `hashtags` to a list of people and tags you want your site to authenticate (because once tweeted it is true).

# Run it

```bash
$ cd ferrit
$ npm install
$ NODE_ENV=production node ferrit.js
```

# Configure nginx to serve "fcode.html" if given "fcode"

```
location ~ ^/(.*)$ {
    alias /home/domain/public_html/;
    try_files $1.html =404;
}
```

# Change it

Sources for everything are in the directory, including the original SVG images. If you're going to do anything other than a parody with this, you should probably make it not look like Verrit.

# Warning

This is all a joke. I wanted a weekend project to learn Node. I also wanted there to be a Verrit with @dril tweets on it, because I thought that would help the world. I succeeded in making a Verrit parody (a perrity...a varody), but did not yet succeed in learning Node. I'll keep working on it (learning Node, not the Verrit parody, I think it's mostly as done as a parody site needs to be).
