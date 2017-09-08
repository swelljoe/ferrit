#!/bin/sh
message=$(echo $1 | fold -s -w45 -)
author=$2
date=$(date +%D -d "$3")
ferritcode=$4

# Overlay message
gm convert -font "ttf/PTN77F.ttf" -pointsize 98 -fill '#232323' -draw "text 289,393 '“${message}”\n— ${author}'" img/ferrit-bg-blank.png "tmp/${ferritcode}.png"

# Overlay ferrit code
gm convert -font "ttf/PTN77F.ttf" -pointsize 48 -fill '#232323' -draw "text 900,953 '${ferritcode}'" "tmp/${ferritcode}.png" "tmp/${ferritcode}.png"

# Overlay QR code
gm composite -geometry +1896+840 "tmp/qr-${ferritcode}.png" "tmp/${ferritcode}.png" "tmp/${ferritcode}.png"

# Rotate
gm convert -rotate 90 "tmp/${ferritcode}.png" "tmp/${ferritcode}.png"

# Source
gm convert -font "ttf/PTN77F.ttf" -pointsize 30 -fill '#232323' -draw "text 111,100 'Source'" "tmp/${ferritcode}.png" "tmp/${ferritcode}.png"
gm convert -font "ttf/PTN77F.ttf" -pointsize 42 -fill '#232323' -draw "text 111,140 'Twitter ${date}'" "tmp/${ferritcode}.png" "tmp/${ferritcode}.png"

# Rotate it back
gm convert -rotate '-90' "tmp/${ferritcode}.png" "tmp/${ferritcode}.png"
