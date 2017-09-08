# ferrit
Ferrit!

# Configure nginx to server fcode.html if given fcode

location ~ ^/(.*)$ {
    alias /home/domain/public_html/;
    try_files $1.html =404;
}
