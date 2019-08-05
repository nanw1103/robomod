#!/bin/sh

RBM_GEO=$(vmtoolsd --cmd "info-get guestinfo.ovfEnv" | grep -o "oe:key=\"rbm.geo\" oe:value=\".*\"" | cut -f4 -d\")
sed -i 's/GEO_PLACEHOLDER/'$RBM_GEO'/' /root/robomod/config.js

cd /root/robomod
node forever.js $* &

