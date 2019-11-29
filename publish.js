const Client = require('ssh2-sftp-client');
const fs = require('fs');
const glob = require('glob')

const privateKey = `PuTTY-User-Key-File-2: ssh-rsa
Encryption: aes256-cbc
Comment: ivanchikishev@MacBook-Pro-Ivan.local
Public-Lines: 6
AAAAB3NzaC1yc2EAAAADAQABAAABAQCddh1+9JWM8vUsBY0enZOjn5tlCvRh20vZ
6kuNbcXIcXGt9cSf2+hFKfnXv+2eMJJSwUYuGaqkb6MUgmdX8L6kj9DvQRu3GE+j
Ud8RrNSMx5V7aVWP8Bv2N5OFH4NoI0jO/woNdsOwzqExX2KV/8FLPjJ8KL25YVxj
sul8LlMvERnbhlO9YHe2f1Jag+jQp9k85LI3MD5D7AAzLRTEtl5Bmu5hCDWWQqoi
t2ZqRMwuFJKBJTo0LbC1e6dnaj8dqDRbfu3e7lMT/qdwE/AhLd1HfQS8WA3dxWha
v4EKuhLBYp7qP4v0FfnwpzaHa6SwFsWZ9ntVpumd10Ocqzh7b/hJ
Private-Lines: 14
cKZ6gTLHFExyHD6UfzioY7SEqb2BFyiDb9Y5fV47puJph6YY2CM6x7EMisAt5kRu
/KO3oF4rkF1VuDZSnynl5QmEJjgIIk0Eabt2E06lDoPXxXDkr3p7zQrUw3NG0zWE
piSY7T9rLzAns3hJgW96XQ8yynukwUGoupL2mIuChbxg6GSzKZB+/0L/G3h3v/DM
avFEjMsNiW3E8uJy0LxPIt/PT998wWslLeJNh1mmlGRq3B5VwjXVeTCyhlAG17eX
7SN5Ph4OX9CyiGgOdDB/dZIV1KOeFUbYAk9Ju6tDsPXdOaq79Z0uB5kkTOnbmzN2
Yzp1KoKKDWtY/vw2tn0BKpLWXcKzG0GXLukgMJVJtqKr7qaBPTcDAUM0x3UKNYqs
TgG7UuV12eq9P3s2GeKQtDV3BFEjaTTEuoOuHvLFoeomALS3iQoDPRFoSJ3K0nec
Y3/+sn95uMuAix3gS3hsevQwHCbeMnyr8g1bNLdbMSXAD+lzgtZJngPzsugSsqzX
X7lTEJ3QKB24HMGP3p3TSC8hjcACTzcXJo9kHanH12ybgojNs4CyxeXlGyNzSDyJ
i0dBJQXto9Pdmj2CVMhdEL6mns6NihE0Yj9uQlR2J7f5tYFCD/WuBiDiZ4Iqd11m
5scLtfcCV4jQLPF4zm2wWZAHx+MWN/HixgQR2X/IhuTx3OvzUrqNUnsxFv3GiR9X
JzgEkj4nu73qxb2zpY/inMBEUiKyszv8DSRg+eT0xGNoc32clv2RkkUpaf445dNh
IO2LwwBd87zZeYhCFFyTgDjwY+jOrLQYY0sHauFQpsYpesRvkWGTNDaDoNrIbj1B
tacKosLB+Y4GrxT3poe/gU9HUi/eXOipnrzDKT13J4k0AHTSSwUVpZzC+KNoheAv
Private-MAC: 67525d4ebc8bf650805b8b479f48ddf273a92bfa`

const config = {
    host: '84.201.153.133',
    port: 22,
    username: 'development',
    privateKey,
    passphrase: '6dr0x0u4ijBT&o^#saY@W5Bm'
};

let sftp = new Client;

sftp.connect(config)
    .then(async () => {
        return await sftp.rmdir('/var/www/html', true).then(async () => {
            return await sftp.mkdir(`/var/www/html`)
        })
    })
    .then(async data => {
        const files = glob.sync('dist/**')
        files.shift()

        for (let key in files) {
            const resolve = files[key].replace('dist/', '')
            const lstat = fs.lstatSync(`dist/${resolve}`)

            if (lstat.isDirectory()) {
                await sftp.mkdir(`/var/www/html/${resolve}`).then(() => {
                    console.log('create dir', resolve)
                })
                continue
            }

            await sftp.fastPut(files[key], `/var/www/html/${resolve}`).catch(console.error).then(() => {
                console.log('upload file', resolve)
            })
        }

    })
    .then(() => {
        sftp.end();
    })
    .catch(err => {
        console.error(err.message);
    });