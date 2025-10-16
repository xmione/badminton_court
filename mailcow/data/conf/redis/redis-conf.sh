#!/bin/sh
cat <<EOF > .\mailcow\data\conf\redis\redis-conf.sh
requirepass 
user quota_notify on nopass ~QW_* -@all +get +hget +ping
EOF

if [ -n "" ]; then
    echo "masterauth " >> .\mailcow\data\conf\redis\redis-conf.sh
fi

exec redis-server /redis.conf
