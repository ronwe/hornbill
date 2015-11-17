#!/bin/bash
if [ $USER != "work" ]
then
    echo "work only"
##  exit 1
fi
rf=$(pwd)'/../'


stopService() {
    echo 'stop service'
    if [ -f $rf'server/config/pids' ]; then
        cat $rf'server/config/pids' | while read line; do
            #echo 'kill '$line ;
            kill $line
        done
        rm -r $rf'server/config/pids'
    fi
}
startService() {
    server_logf='/tmp/log/hornbill-server/'` date +%Y/%m/`
    server_log=$server_logf`date +%d`'.log'
    echo 'SERVICE START AT '` date +%Y/%m/%d-%T` >> $server_log
    mkdir -p $server_logf
    echo 'web service start , logfile:'$server_log
    cd $rf'server/' && nohup node index.js >> $server_log &
}
clearTmp(){
    rm -r $rf/../.est/*.est
    echo 'template  clear'
}
if [ $# -eq 0 ];then
    echo "you should pass args start|restart|stop|clear"
else
    case $1 in
        "clear")
            clearTmp
            ;;
        "stop")
            stopService
            ;;
        "start")
            startService
            ;;
        "restart")
            stopService
            clearTmp
            startService
            ;;
    esac
fi
