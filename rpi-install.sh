#By Hotfirenet

# Update & upgrade package
sudo apt-get update && sudo apt-get -y upgrade

# Installing building tools
sudo apt-get install -y build-essential git

# Installing Node.js

If RPI A, B, B+
wget https://nodejs.org/dist/v4.2.4/node-v4.2.4-linux-armv6l.tar.gz
tar -xvf node-v4.2.4-linux-armv6l.tar.gz
cd node-v4.2.4-linux-armv6l

#If RPI 2
#wget https://nodejs.org/dist/v4.2.2/node-v4.2.2-linux-armv7l.tar.xz
#tar -xvf node-v4.2.2-linux-armv7l.tar.xz
#cd node-v4.2.2-linux-armv7l

sudo cp -R * /usr/local/

cd

git clone https://github.com/JpEncausse/SARAH-Server-NodeJS.git
cd SARAH-Server-NodeJS/server/app
sudo npm install

mkdir data
cp server/server.prop data/custom.prop

cd /home/pi/SARAH-Server-NodeJS/

sudo env "NODE_PATH=$PWD/server/app/node_modules"
sudo -E node /home/pi/SARAH-Server-NodeJS/server/app/app.js
