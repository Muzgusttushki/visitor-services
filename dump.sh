 mongodump --ssl \
          --sslCAFile /usr/local/share/ca-certificates/Yandex/YandexInternalRootCA.crt \
          --host 'rs01/rc1b-obsi4apyngb4yppx.mdb.yandexcloud.net:27018' \
          -u collector \
          -p 180477QwE \
          --db  db1


 mongodump --ssl \
          --sslCAFile /usr/local/share/ca-certificates/Yandex/YandexInternalRootCA.crt \
          --host 'rs01/rc1c-helkvhfjv7yt2k9n.mdb.yandexcloud.net:27018' \
          -u cluster \
          -p Vh7usUCZydYRQqPP \
          --db  db1


mongorestore --ssl           --sslCAFile /usr/local/share/ca-certificates/Yandex/YandexInternalRootCA.crt           --host 'rs01/rc1b-obsi4apyngb4yppx.mdb.yandexcloud.net:27018' -u collector -p 180477QwE --db db1 dump/db1
