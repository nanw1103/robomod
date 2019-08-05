#!/bin/sh

#auto start nginx
chkconfig nginx on

#kill rbm instances
killall node

#auto start rbm
chmod +x launch-ec2.sh

#manually add it: //FIXME
#chmod +x /etc/rc.local
#manually add the following line to end of /etc/rc.local:
#/rbm-svr/robomod/tools/launch-ec2.sh

cd ..
node code/cli/clean.js

reboot

