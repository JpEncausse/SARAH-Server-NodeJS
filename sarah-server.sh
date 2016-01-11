#!/bin/bash
### Shell d'administration pour SARAH server
# By Hotfirenet (Johan VIVIEN)
# Sur une base de script fait par Jérémy HOCDÉ

function sarah_pid() {
	sarah_pid=$(pgrep -fl "node /home/pi/SARAH-Server-NodeJS/server/app/app.js" | grep -v sudo | awk '{print $1}')
}

function sarah_status() {
	sarah_pid
	if [ -z $sarah_pid ]; then
		echo "S.A.R.A.H. is not started"
	else
		echo "S.A.R.A.H. is started (PID: $sarah_pid)"
	fi
}

function sarah_start() {
	sarah_pid
	if [ -z $sarah_pid ]; then
		export NODE_PATH=/home/pi/SARAH-Server-NodeJS/server/app/node_modules
		sudo -E node /home/pi/SARAH-Server-NodeJS/server/app/app.js &
	else
		echo "eRRoR: S.A.R.A.H. is already started"
	fi
}

function sarah_stop() {
   sarah_pid
   if [ -z $sarah_pid ]; then
      echo "eRRoR: S.A.R.A.H. is not started"
   else
      sudo kill -9 $sarah_pid
   fi
}

function sarah_restart() {
   sarah_stop
   sleep 5
   sarah_start
}

case "$1" in
   start)
      echo "starting S.A.R.A.H. ..."
      sarah_start
      ;;
   restart)
      echo "restarting S.A.R.A.H. ..."
      sarah_restart
      ;;
   stop)
      echo "stoping S.A.R.A.H. ..."
      sarah_stop
      ;;
   status)
      sarah_status
      ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac

exit 0
