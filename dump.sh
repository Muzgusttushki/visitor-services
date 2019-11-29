 mongodump --ssl \
          --sslCAFile /usr/local/share/ca-certificates/Yandex/YandexInternalRootCA.crt \
          --host 'rs01/rc1b-obsi4apyngb4yppx.mdb.yandexcloud.net:27018' \
          -u collector \
          -p 180477QwE \
          --db  db1


 mongorestore --ssl \
          --sslCAFile /usr/local/share/ca-certificates/Yandex/YandexInternalRootCA.crt \
          --host 'rs01/rc1b-obsi4apyngb4yppx.mdb.yandexcloud.net:27018' \
          -u collector \
          -p 180477QwE \
          --db  db1


mongorestore --ssl           --sslCAFile /usr/local/share/ca-certificates/Yandex/YandexInternalRootCA.crt           --host 'rs01/rc1b-obsi4apyngb4yppx.mdb.yandexcloud.net:27018' -u collector -p 180477QwE --db db1 dump/db1
