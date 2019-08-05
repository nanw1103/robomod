#!/bin/sh

killall node
cd ..
node code/cli/clean.js
cp tools/config.build config.js
rm /etc/profile.d/proxy.sh
poweroff

