import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperationObject } from '../../transferDataObject/buyers/OperationObject';
import { PaymentsUsers } from './dataTransfers/users.dto'
import { PaymentsFiltersDataObject } from './dataTransfers/PaymentsFiltersDataObject';
import { DetailsUserDataObject } from './dataTransfers/DetailsUserDataObject';
import { OperationDetailsDataObject } from '../operations/dataTransfers/operationDetailsDataObject';
import { ObjectID } from 'bson';

@Injectable()
export class BuyersService {
  constructor(
    @InjectModel('buyers')
    private readonly operationSchema: Model<OperationObject>,
  ) { }
  async getFilters(insulation: object): Promise<Record<string, object>> {
    const context = this.operationSchema.aggregate();

    context.match({
      ...insulation,
      status: 'WIDGET_PAYMENT',
      'addressInfo.city': { $exists: true, $ne: null },
    });

    context.group({
      _id: '$buyer.phone',
      tickets: { $push: '$tickets' },
      cities: { $push: '$addressInfo.city' },
      events: { $push: '$event.name' }
    });

    context.addFields({
      tickets: {
        $reduce: {
          input: '$tickets',
          initialValue: [],
          in: { $concatArrays: ['$$value', '$$this'] },
        }
      }
    }).addFields({
      earnings: {
        $reduce: {
          input: '$tickets',
          initialValue: 0,
          in: {
            $add: ['$$value', {
              $cond: {
                if: { $eq: ['$this.quantity', 1] },
                then: '$$this.price',
                else: {
                  $multiply: ['$$this.price', '$$this.quantity'],
                },
              },
            }],
          },
        },
      },

      ticketsCount: {
        $sum: '$tickets.quantity',
      }
    }).addFields({
      averageEarnings: {
        $cond: {
          if: { $eq: ['$ticketsCount', 0] },
          then: 0,
          else: { $divide: ['$earnings', '$ticketsCount'] }
        }
      }
    })

    context.group({
      _id: null,
      minEarnings: { $min: '$earnings' },
      maxEarnings: { $max: '$earnings' },
      minAverageEarnings: { $min: '$averageEarnings' },
      maxAverageEarnings: { $max: '$averageEarnings' },
      minTickets: { $min: '$ticketsCount' },
      maxTickets: { $max: '$ticketsCount' },
      events: { $push: '$events' },
      cities: { $push: '$cities' }
    }).project({
      _id: false,
      maxEarnings: true,
      minEarnings: true,
      minAverageEarnings: true,
      maxAverageEarnings: true,
      minTickets: true,
      maxTickets: true,
      events: {
        $setUnion: {
          $reduce: {
            input: '$events',
            initialValue: [],
            in: { $concatArrays: ['$$value', '$$this'] },
          }
        }
      },
      cities: {
        $setUnion: [{
          $reduce: {
            input: '$cities',
            initialValue: [],
            in: { $concatArrays: ['$$value', '$$this'] },
          }
        }]
      }
    })

    return await context
      .exec()
      .then((resolve: { shift: () => [] }) => resolve.shift())
      .catch(console.error)
  }


  async transactionDetatils(stage: OperationDetailsDataObject, insulation: object): Promise<object> {
    const request = this.operationSchema.aggregate();

    request.match({
      _id: new ObjectID(stage.offset),
      source: insulation['source']
    })

    request.group({
      _id: '$_id',
      date: { $last: '$date' },
      dateEvent: { $last: '$event.date' },
      nameEvent: { $last: '$event.name' },
      utm: { $last: '$utm' },

      userName: { $last: '$buyer.name' },
      userEmail: { $last: '$buyer.email' },
      userPhone: { $last: '$buyer.phone' },

      tickets: { $last: '$tickets' },
      seats: { $push: '$tickets.variant' },

      country: { $last: '$addressInfo.country' },
      city: { $last: '$addressInfo.city' },
      region: { $last: '$addressInfo.region' },
      zip: { $last: '$addressInfo.zip' },
      timezone: { $last: '$addressInfo.timezone' },


      browser: { $last: '$browser' },
      os: { $last: '$os' },
      cookies: { $last: '$analytics' },
      source: { $last: '$source' }
    })

    request.addFields({
      tickets: {
        $sum: '$tickets.quantity'
      }
    })

    return await request.exec().then(resolve => {
      return resolve.shift()
    })
  }

  async payments(stage: PaymentsFiltersDataObject, insulation: object): Promise<PaymentsUsers> {
    if (!(stage.ticketInTransaction.length == 2 && stage.averageMoney.length == 2 && stage.money.length == 2)) {
      throw new BadRequestException();
    }

    const context = this.operationSchema.aggregate();
    context.allowDiskUse(true)
    context.match({
      source: insulation['source'],
      status: 'WIDGET_PAYMENT',
      buyer: { $exists: true },
    }).group({
      _id: '$buyer.phone',
      events: { $last: '$event.name' },
      lastActive: { $last: '$date' },
      firstActive: { $first: '$date' },
      tickets: { $push: '$tickets' },
      cities: { $push: '$addressInfo.city' },
      source: { $last: '$source' },
      transactions: { $sum: 1 },
      name: { $last: '$buyer.name' },
    }).addFields({
      tickets: {
        $reduce: {
          input: '$tickets',
          initialValue: [],
          in: { $concatArrays: ['$$value', '$$this'] },
        }
      }
    }).addFields({
      earnings: {
        $reduce: {
          input: '$tickets',
          initialValue: 0,
          in: {
            $add: ['$$value', {
              $cond: {
                if: { $eq: ['$this.quantity', 1] },
                then: '$$this.price',
                else: {
                  $multiply: ['$$this.price', '$$this.quantity'],
                },
              },
            }],
          },
        },
      },

      ticketsCount: {
        $sum: '$tickets.quantity',
      }
    }).addFields({
      averageEarnings: {
        $divide: ['$earnings', '$ticketsCount']
      }
    })

    const filters = [

    ];

    filters.push(
      //money filter
      { $lte: ['$$item.earnings', stage.money[1]] },
      { $gte: ['$$item.earnings', stage.money[0]] },

      //average money filter
      { $lte: ['$$item.averageEarnings', stage.averageMoney[1]] },
      { $gte: ['$$item.averageEarnings', stage.averageMoney[0]] },

      //average tickets filter
      { $lte: ['$$item.ticketsCount', stage.ticketInTransaction[1]] },
      { $gte: ['$$item.ticketsCount', stage.ticketInTransaction[0]] });


    if (stage.event.length) {
      filters.push({
        $or: stage.event.map(resolve => {
          return { $in: [resolve, '$$item.events'] }
        })
      })
    }

    if (stage.city.length) {
      filters.push({
        $or: stage.city.map(resolve => {
          return { $in: [resolve, '$$item.cities'] }
        })
      })
    }

    context.sort({ lastActive: -1 })

    context.group({
      _id: null,
      buyers: { $push: '$$CURRENT' }
    }).project({
      _id: false,
      buyers: {
        $filter: {
          input: '$buyers',
          as: 'item',
          cond: {
            $and: filters
          }
        }
      }
    }).project({
      length: { $size: ['$buyers'] },
      data: { $slice: ['$buyers', stage.offset * 10, 10] }
    })


    return await context.exec().then((resolve: []) => resolve.shift());
  }

  async getBuyerDetailsPersona(details: DetailsUserDataObject, insulation: object): Promise<object> {
    const request = this.operationSchema.aggregate();

    request.match({
      source: insulation['source'],
      $or: [{ 'buyer.phone': { $eq: details.phone } }],
      status: 'WIDGET_PAYMENT'
    })

    request.group({
      _id: null,
      analytics: { $push: '$analytics.google' },
      firstActive: { $first: '$date' },
      lastActive: { $last: '$date' },
      city: { $last: '$addressInfo.city' },
      email: { $last: '$buyer.email' },
      phone: { $last: '$buyer.phone' },
      gender: { $last: '$buyer.gender' }
    })

    return await request.exec().then(resolve => resolve.shift());
  }

  async detailsPresona(stage: DetailsUserDataObject, insulation: object): Promise<object> {
    let request = this.operationSchema.aggregate();

    request.match({
      source: insulation['source'],
      $or: [{ 'buyer.phone': { $eq: stage.phone } }],
      status: 'WIDGET_PAYMENT'
    })

    request.group({
      _id: null,
      analytics: { $push: '$analytics.google' },
      firstActive: { $first: '$date' },
      lastActive: { $last: '$date' },
      city: { $last: '$addressInfo.city' },
      email: { $last: '$buyer.email' },
      phone: { $last: '$buyer.phone' },
      username: { $first: '$buyer.name' },
      source: { $last: '$source' },
      gender: { $last: '$buyer.gender' }
    })

    const aboutUser = await request.exec().then(resolve => {
      return resolve.shift();
    })


    if (!aboutUser)
      throw new ForbiddenException()


    request = this.operationSchema.aggregate();
    request
      .match({
        source: insulation['source'],
        'analytics.google': { $ne: null, $exists: true },
        status: 'WIDGET_PAYMENT',
        $or: [{ 'buyer.phone': aboutUser.phone },
        { 'analytics.google': { $in: aboutUser.analytics } }]
      })
      .group({
        _id: null,
        tickets: { $push: '$tickets' },
        sales: { $sum: 1 }
      })
      .addFields({
        tickets: {
          $reduce: {
            input: '$tickets',
            initialValue: [],
            in: { $concatArrays: ['$$value', '$$this'] },
          }
        }
      })
      .addFields({
        earnings: {
          $reduce: {
            input: '$tickets',
            initialValue: 0,
            in: {
              $add: ['$$value', {
                $cond: {
                  if: { $eq: ['$this.quantity', 1] },
                  then: '$$this.price',
                  else: {
                    $multiply: ['$$this.price', '$$this.quantity'],
                  },
                },
              }],
            },
          },
        },
        tickets: { $sum: '$tickets.quantity' }
      })
      .project({
        tickets: true,
        earnings: true,
        averageEarnings: {
          $floor: {
            $cond: {
              if: { $or: [{ $eq: ['$sales', 0] }, { $eq: ['$earnings', 0] }] },
              then: 0,
              else: { $divide: ['$earnings', '$sales'] }
            }
          }
        },
        averageTickets: {
          $floor: {
            $cond: {
              if: { $or: [{ $eq: ['$sales', 0] }, { $eq: ['$tickets', 0] }] },
              then: 0,
              else: { $divide: ['$tickets', '$sales'] }
            }
          }
        },
        sales: true
      })


    const userTransactions = await request.exec().then(resolve => {
      return resolve.shift()
    });

    request = this.operationSchema.aggregate();

    request.match({
      source: insulation['source'],
      'analytics.google': { $ne: null, $exists: true },
      status: 'WIDGET_PAYMENT',
      $or: [{ 'buyer.phone': aboutUser.phone },
      { 'analytics.google': { $in: aboutUser.analytics } }]
    }).addFields({
      earnings: {
        $reduce: {
          input: '$tickets',
          initialValue: 0,
          in: {
            $add: ['$$value', {
              $cond: {
                if: { $eq: ['$this.quantity', 1] },
                then: '$$this.price',
                else: {
                  $multiply: ['$$this.price', '$$this.quantity'],
                },
              },
            }],
          },
        },
      },
      tickets: { $sum: '$tickets.quantity' }
    }).project({
      date: true,
      event: '$event.name',
      earnings: true,
      source: '$source',
      city: '$addressInfo.city',
      tickets: true,
      _id: false,
      offset: '$_id'
    });

    const details = await request.exec()

    request = this.operationSchema.aggregate();

    request.match({
      source: insulation['source'],
      'analytics.google': { $ne: null, $exists: true },
      $or: [{ 'buyer.phone': aboutUser.phone },
      { 'analytics.google': { $in: aboutUser.analytics } }]
    })

    request.group({
      _id: null,
      operations: {
        $push: {
          date: '$$CURRENT.date',
          status: '$$CURRENT.status'
        }
      }
    })

    function createArraysDate(days): Array<object> {
      days = Math.floor(days);

      const arrays = [];
      const hoursInDays = days * 24 / 12

      const current = new Date();
      current.setUTCDate(current.getUTCDate() - days)
      current.setUTCHours(0, 0, 0, 0)

      const countdown = new Date();

      countdown.setUTCDate(countdown.getUTCDate() - days)
      countdown.setUTCHours(0, 0, 0, 0)
      countdown.setUTCMilliseconds(countdown.getUTCMilliseconds() - 1)

      for (let i = 0; i < 12; i++) {
        countdown.setUTCHours(countdown.getUTCHours() + (hoursInDays))

        arrays.push({
          current: new Date(current.toISOString()),
          countdown: new Date(countdown.toISOString()),
        });

        current.setUTCHours(current.getUTCHours() + (hoursInDays))
      }

      return arrays
    }

    request.project({
      year: {
        dates: createArraysDate(364),
        operations: createArraysDate(364).map((resolve: { current: Date; countdown: Date }) => {
          return {
            $size: {
              $filter: {
                input: '$operations',
                as: 'operations',
                cond: {
                  $and: [
                    { $gte: ['$$operations.date', resolve.current] },
                    { $lte: ['$$operations.date', resolve.countdown] },
                    { $ne: ['$$operations.status', 'WIDGET_PAYMENT'] }
                  ]
                }
              }
            }
          }
        }),

        transactions: createArraysDate(364).map((resolve: { current: Date; countdown: Date }) => {
          return {
            $size: {
              $filter: {
                input: '$operations',
                as: 'operations',
                cond: {
                  $and: [
                    { $gte: ['$$operations.date', resolve.current] },
                    { $lte: ['$$operations.date', resolve.countdown] },
                    { $eq: ['$$operations.status', 'WIDGET_PAYMENT'] }
                  ]
                }
              }
            }
          }
        })
      },
      month: {
        dates: createArraysDate(30),
        operations: createArraysDate(30).map((resolve: { current: Date; countdown: Date }) => {
          return {
            $size: {
              $filter: {
                input: '$operations',
                as: 'operations',
                cond: {
                  $and: [
                    { $gte: ['$$operations.date', resolve.current] },
                    { $lte: ['$$operations.date', resolve.countdown] },
                    { $ne: ['$$operations.status', 'WIDGET_PAYMENT'] }
                  ]
                }
              }
            }
          }
        }),

        transactions: createArraysDate(30).map((resolve: { current: Date; countdown: Date }) => {
          return {
            $size: {
              $filter: {
                input: '$operations',
                as: 'operations',
                cond: {
                  $and: [
                    { $gte: ['$$operations.date', resolve.current] },
                    { $lte: ['$$operations.date', resolve.countdown] },
                    { $eq: ['$$operations.status', 'WIDGET_PAYMENT'] }
                  ]
                }
              }
            }
          }
        })
      },
      week: {
        dates: createArraysDate(7),
        operations: createArraysDate(7).map((resolve: { current: Date; countdown: Date }) => {
          return {
            $size: {
              $filter: {
                input: '$operations',
                as: 'operations',
                cond: {
                  $and: [
                    { $gte: ['$$operations.date', resolve.current] },
                    { $lte: ['$$operations.date', resolve.countdown] },
                    { $ne: ['$$operations.status', 'WIDGET_PAYMENT'] }
                  ]
                }
              }
            }
          }
        }),

        transactions: createArraysDate(7).map((resolve: { current: Date; countdown: Date }) => {
          return {
            $size: {
              $filter: {
                input: '$operations',
                as: 'operations',
                cond: {
                  $and: [
                    { $gte: ['$$operations.date', resolve.current] },
                    { $lte: ['$$operations.date', resolve.countdown] },
                    { $eq: ['$$operations.status', 'WIDGET_PAYMENT'] }
                  ]
                }
              }
            }
          }
        })
      },

    });

    const activity = await request.exec()


    request = this.operationSchema.aggregate();

    request.match({
      source: insulation['source'],
      'analytics.google': { $ne: null, $exists: true },
      $or: [{ 'buyer.phone': aboutUser.phone },
      { 'analytics.google': { $in: aboutUser.analytics } }],
      browser: { $ne: null, $exists: true },
      os: { $ne: null, $exists: true }
    })

    request.group({
      _id: null,
      operations: {
        $push: {
          os: '$os.name'
        }
      }
    });

    request.project({
      devices: {
        computer: {
          $size: {
            $filter: {
              input: '$operations',
              as: 'operation',
              cond: {
                $in: ['$$operation.os', ["Chrome OS aarch64", "Windows Server 2003 / XP 64-bit", "Windows Server 2008 R2 / 7", "OS X", "Windows", "Linux", "Windows XP", "Windows Server 2008 / Vista", "Linux i686", "OpenBSD", "Ubuntu", "Chrome OS", "Ubuntu Chromium"]]
              }
            }
          }
        },

        phone: {
          $size: {
            $filter: {
              input: '$operations',
              as: 'operation',
              cond: {
                $in: ['$$operation.os', ["Windows Phone", "BlackBerry", "Windows Phone 8.x", "Android", "iOS"]]
              }
            }
          }
        }
      }
    });

    request.project({
      devices: {
        $let: {
          vars: {
            total: { $add: ['$devices.computer', '$devices.phone'] }
          },

          in: {
            phone: {
              $cond: {
                if: { $eq: ['$$total', 0] },
                then: 0,
                else: { $multiply: [{ $divide: ['$devices.phone', '$$total'] }, 100] }
              }
            },

            computer: {
              $cond: {
                if: { $eq: ['$$total', 0] },
                then: 0,
                else: { $multiply: [{ $divide: ['$devices.computer', '$$total'] }, 100] }
              }
            }
          }
        }
      }
    });

    const devices = await request.exec().then(resolve => {
      return resolve.shift()
    })

    return {
      aboutUser,
      userTransactions,
      details,
      activity,
      devices
    }
  }

  /**
   * @description блок статистику по операциям
   */
  async detailsOperationStats() {

    return null;
  }

  /**
  * @description блок статистику по операциям
  */
  async detailsPaymentStats() {

    return null;
  }
}
