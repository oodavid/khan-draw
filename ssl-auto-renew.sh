#!/bin/bash
#	Source
#		https://gist.github.com/oodavid/54cadfb92ff49618797d
#  	Adapted from
#		https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-14-04
# 	Make sure this is added to the crontab, ie:
# 		sudo crontab -e
#    	30 2 * * 1 /home/ubuntu/khan-draw/ssl-auto-renew.sh >> /var/log/ssl-auto-renew.log

# Config
le_path="/home/ubuntu/letsencrypt";
email="david@oodavid.com";
webroot="/home/ubuntu/khan-draw/";
domains="draw.oodavid.com"; # Comma Seperated list of domains
exp_limit=30;
web_service="nginx";

# Root required
if [[ $EUID -ne 0 ]]; then
	echo "Setup - This script must be run as root";
	exit 0;
fi;

# Get the certificate path from the domains (we only look at the first in a comma seperated list)
domain=`echo $domains | sed 's/,.*//'`;
cert_file="/etc/letsencrypt/live/$domain/fullchain.pem";
if [ ! -f $cert_file ]; then
	echo "[ERROR] certificate file not found for domain $domain.";
	exit 0;
fi;

# Check the date
exp=$(date -d "`openssl x509 -in $cert_file -text -noout|grep "Not After"|cut -c 25-`" +%s)
datenow=$(date -d "now" +%s)
days_exp=$(echo \( $exp - $datenow \) / 86400 |bc)
if [ "$days_exp" -gt "$exp_limit" ] ; then
	echo "The certificate is up to date, no need for renewal ($days_exp days left).";
	exit 0;
fi;

# Update the cert
echo "The certificate for $domain is about to expire. Starting renewal script..."
$le_path/letsencrypt-auto certonly -a webroot --agree-tos --renew-by-default --email $email --webroot-path=$webroot --domains="$domains"

# Reload our service
echo "Reloading $web_service"
/usr/sbin/service $web_service reload
