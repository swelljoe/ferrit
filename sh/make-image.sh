#!/usr/bin/bash
message=$(echo $1 | fold -s -w45 -)
author=$2
date=$(date +%D -d "$3")
ferritcode=$4

mkdir -p tmp/
mkdir -p public/img

# Overlay message
gm convert -encoding Unicode -font "ttf/PTN77F.ttf" -pointsize 98 -fill '#232323' -draw "text 289,393 '“${message}”\n— ${author}'" assets/img/ferrit-bg-blank.png "tmp/${ferritcode}.png"

# Overlay ferrit code
gm convert -encoding Unicode -font "ttf/PTN77F.ttf" -pointsize 48 -fill '#232323' -draw "text 900,953 '${ferritcode}'" "tmp/${ferritcode}.png" "tmp/${ferritcode}.png"

# Overlay QR code
gm composite -geometry +1896+840 "tmp/qr-${ferritcode}.png" "tmp/${ferritcode}.png" "tmp/${ferritcode}.png"

# Rotate
gm convert -rotate 90 "tmp/${ferritcode}.png" "tmp/${ferritcode}.png"

# Source
gm convert -encoding Unicode -font "ttf/PTN77F.ttf" -pointsize 30 -fill '#232323' -draw "text 111,100 'Source'" "tmp/${ferritcode}.png" "tmp/${ferritcode}.png"
gm convert -encoding Unicode -font "ttf/PTN77F.ttf" -pointsize 42 -fill '#232323' -draw "text 111,140 'Twitter ${date}'" "tmp/${ferritcode}.png" "tmp/${ferritcode}.png"

# Rotate it back
gm convert -rotate '-90' "tmp/${ferritcode}.png" "tmp/${ferritcode}.png"

# Move it to public/img
mv "tmp/${ferritcode}.png" public/img/

# Clean up the qr code (spooky action at a distance, hooray!)
rm "tmp/qr-${ferritcode}.png"
