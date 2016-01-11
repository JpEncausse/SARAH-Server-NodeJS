#!/bin/bash
### Shell d'installation de SARAH server
# By Hotfirenet (Johan VIVIEN)

#@TODO demander confirmation que l'installation doit se faire ici $PWD read ..

# Update & upgrade package
echo "Mise a jour du système"
sudo apt-get update && sudo apt-get -y upgrade

# Installing building tools
echo "Installation de git et des building tools"
sudo apt-get install -y build-essential git

# Installing Node.js
if [ ! -f "/usr/local/bin/node" ];then

	echo "Installation de node.js"

	revision=$(cat /proc/cpuinfo | grep Revision | cut -c12-)

	case $revision in
	        0002 | 0003 | 0004 | 0005 | 0004 | 0006 | 0007 | 0008 | 0009 | 000d | 000e | 000f | 0010 | 0011 | 0012)
					#If RPI A, B, B+
					wget https://nodejs.org/dist/v4.2.4/node-v4.2.4-linux-armv6l.tar.gz
					tar -xvf node-v4.2.4-linux-armv6l.tar.gz
					cd node-v4.2.4-linux-armv6l
	                ;;
	        a01041 | a21041)
					#If RPI 2
					wget https://nodejs.org/dist/v4.2.2/node-v4.2.2-linux-armv7l.tar.xz
					tar -xvf node-v4.2.2-linux-armv7l.tar.xz
					cd node-v4.2.2-linux-armv7l
	                ;;
	        *)
	                echo "ERREUR est ce un pi ?"
	                stop=1
	                ;;
	esac

	installNode=1
else
	echo "Node est déjà présent en version: "; node -v
fi

if [ -z $stop ]; then

	if [ ! -z $installNode ]; then
		sudo cp -R * /usr/local/
		echo "Suppresion de l'archive et du repertoire décompressé"
		sudo rm -r node*
	fi

	cd /home/pi/

	if [ ! -d "/home/pi/SARAH-Server-NodeJS" ];then

		echo "Rapatriement de SARAH Server"
		git clone https://github.com/JpEncausse/SARAH-Server-NodeJS.git
		cd SARAH-Server-NodeJS/server/app
	else 
		echo "Le dossier SARAH-Server-NodeJS existe déjà"
	fi

	echo "Installation des dépendances"
	sudo npm install

	if [ ! -d "/home/pi/SARAH-Server-NodeJS/server/app/data" ];then
		mkdir /home/pi/SARAH-Server-NodeJS/server/app/data

	else 
		echo "Le répertoire data existe déjà"
	fi

	if [ ! -f "/home/pi/SARAH-Server-NodeJS/server/app/data/custom.prop" ];then
		echo "Création du custom.prop"
		cp /home/pi/SARAH-Server-NodeJS/server/app/server/server.prop /home/pi/SARAH-Server-NodeJS/server/app/data/custom.prop

		state=1
	fi	
fi

sudo chmod +x /home/pi/SARAH-Server-NodeJS/sarah-server.sh
cd /home/pi/SARAH-Server-NodeJS/
./sarah-server.sh start &

#@TODO a revoir 
# if [ -z $stop ] && [ ! -z $state ]; then
# 	echo "Déplacement du fichier d'administration dans le init.d"
# 	sudo mv /home/pi/SARAH-Server-NodeJS/sarah-server.sh /etc/init.d/sarah-server
# 	sudo chmod +x /etc/init.d/sarah-server

# 	while true; do
# 	    read -p "Voulez vous lancer SARAH Server au démarrage?" yn
# 	    case $yn in
# 	        [Oo]* ) sudo update-rc.d sarah-server defaults; break;;
# 	        [Nn]* ) break;;
# 	        * ) echo "Répondre par Oui ou par Non.";;
# 	    esac
# 	done


# 	echo "Lancement de SARAH Server"
# 	sudo service sarah-server start
# fi

exit 0
