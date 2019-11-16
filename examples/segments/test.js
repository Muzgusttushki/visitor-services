/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
const util = require('util');

const url = util.format(
    'mongodb://%s:%s@%s/db1?replicaSet=%s&authSource=%s&ssl=true',
    'collector',
    '180477QwE',
    [
      'rc1b-obsi4apyngb4yppx.mdb.yandexcloud.net:27018'
    ].join(','),    
    'rs01',
    'db1'
  )
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const options = {
    useNewUrlParser: true,
    replicaSet: {
      sslCA: fs.readFileSync('/usr/local/share/ca-certificates/Yandex/YandexInternalRootCA.crt')
    },
    useUnifiedTopology: true,
    useFindAndModify: true,
    useCreateIndex: true,
  }


mongoose.connect('mongodb://localhost:27017/db1', {
    useNewUrlParser: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});


const addressSchema = mongoose.model('addresses', new mongoose.Schema({
    address: String,

    city: String,
    country: String,
    region: String,
    district: String,

    timezone: String,
    zip: String
}))

async function getAddressDetails(address) {
    const access = "82c35ecad84b87"
    return await addressSchema.findOne({
        address
    })
        .exec()
        .then(async (err, resolve) => {
            if (resolve) {
                return resolve;
            }

            const info = await axios.get(`https://ipinfo.io/${address}?token=${access}&lang=ru`)
                .then(async resolve => {
                    const { city, region, country, postal, timezone } = resolve.data

                    return await new addressSchema({
                        address: address,
                        city,
                        country,
                        zip: postal,
                        timezone,
                        region
                    }).save()
                })

            return info
        })
}

async function example() {
    const users = mongoose.model('buyers', new mongoose.Schema({
        session: String,
        address: String,
        address_info: Object,
        addressInfo: Object,
        analytics: Object,
        trash: Array,
        brokenTickets: Array,
        tickets: Array,
        browser: Object,
        date: Date,
        source: String,
        status: String,
        event: Object,
        utm: Object,
    }))

    users.aggregate([])
        .match({ addressInfo: { $eq: null } })
        .exec(async (err, resolve) => {
            for (const i in resolve) {
                const db = resolve[i];

                let address = {}
                if (!db.address_info) {
                    address = await getAddressDetails(db.address)

                    await new Promise(resolve => {
                        setTimeout(resolve, 1)
                    })
                } else {
                    address = {
                        city: db.address_info.main.city,
                        country: db.address_info.main.country,
                        zip: db.address_info.main.zip,
                        timezone: db.address_info.main.timezone,
                        region: db.address_info.main.regionName
                    }
                }

                users.updateOne({
                    _id: db._id
                }, {
                    v1: true,
                    brokenTickets: null,
                    trash: db.brokenTickets,
                    address_info: null,
                    addressInfo: address
                }, function (err, raw) {
                    if (err) {
                        console.log('err build segment', err)

                        return;
                    }

                    console.log(`OK (${i}) as (${resolve.length})`, raw)
                })
            }
        })

    /*
    const request = bootstrap.bind(segment)()

    console.log(await users.aggregate([{ $limit: 10 }, {
        $group: {
            _id: null,
            operations: {
                $push: "$$CURRENT"
            }
        }
    }, {
        $project: {
            operations: {
                $filter: {
                    input: '$operations',
                    as: "item",
                    cond: request
                }
            }
        }
    }]).allowDiskUse(true).exec())*/
}

example()
