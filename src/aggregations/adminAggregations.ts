import { PipelineStage } from "mongoose";

const adminAggregations = {
  getEarnings: (): PipelineStage[] => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const firstDayOfMonth = startOfThisMonth.getDay();

    return [
      {
        $project: {
          transaction: {
            $let: {
              vars: {
                history: {
                  $cond: [{ $isArray: "$transaction.history" }, "$transaction.history", []]
                }
              },
              in: {
                latest: {
                  $arrayElemAt: ["$$history", -1]
                }
              }
            }
          },
          bookingStatus: 1,
          paymentStatus: "$transaction.paymentStatus"
        }
      },
      {
        $project: {
          amount: "$transaction.latest.baseAmount",
          refundableAmount: "$transaction.latest.baseRefundableAmount",
          status: "$transaction.latest.status",
          attemptDate: "$transaction.latest.attemptDate",
          bookingStatus: 1,
          paymentStatus: 1,
          year: { $year: "$transaction.latest.attemptDate" },
          month: { $month: "$transaction.latest.attemptDate" },
          day: { $dayOfMonth: "$transaction.latest.attemptDate" },
          twoHourInterval: {
            $floor: {
              $divide: [{ $hour: "$transaction.latest.attemptDate" }, 2]
            }
          },
          weekOfMonth: {
            $ceil: {
              $divide: [
                { $add: [{ $dayOfMonth: "$transaction.latest.attemptDate" }, { $subtract: [firstDayOfMonth, 1] }] },
                7
              ]
            }
          }
        }
      },
      {
        $facet: {
          totalPendingEarnings: [
            { $match: { bookingStatus: "pending" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
            { $project: { _id: 0, total: 1 } }
          ],
          totalSuccessfulEarnings: [
            { $match: { bookingStatus: "success" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
            { $project: { _id: 0, total: 1 } }
          ],
          todaySuccessfulEarnings: [
            { $match: { bookingStatus: "success", attemptDate: { $gte: startOfToday } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
            { $project: { _id: 0, total: 1 } }
          ],
          todayPendingEarnings: [
            { $match: { bookingStatus: "pending", attemptDate: { $gte: startOfToday } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
            { $project: { _id: 0, total: 1 } }
          ],
          retainedFromCanceled: [
            {
              $match: {
                bookingStatus: "canceled",
                paymentStatus: "refunded",
                $expr: { $lt: ["$refundableAmount", "$amount"] }
              }
            },
            {
              $project: {
                retained: { $subtract: ["$amount", "$refundableAmount"] }
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$retained" }
              }
            },
            { $project: { _id: 0, total: 1 } }
          ],
          retainedFromCanceledToday: [
            {
              $match: {
                bookingStatus: "canceled",
                paymentStatus: "refunded",
                attemptDate: { $gte: startOfToday },
                $expr: { $lt: ["$refundableAmount", "$amount"] }
              }
            },
            {
              $project: {
                retained: { $subtract: ["$amount", "$refundableAmount"] }
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$retained" }
              }
            },
            { $project: { _id: 0, total: 1 } }
          ],
          earningsByTwoHours: [
            {
              $match: {
                attemptDate: { $gte: startOfToday },
                bookingStatus: "success"
              }
            },
            {
              $group: {
                _id: "$twoHourInterval",
                total: { $sum: "$amount" }
              }
            },
            { $sort: { _id: 1 } }
          ],
          earningsByWeek: [
            {
              $match: {
                attemptDate: { $gte: startOfThisMonth, $lte: endOfThisMonth },
                bookingStatus: "success"
              }
            },
            {
              $group: {
                _id: "$weekOfMonth",
                total: { $sum: "$amount" }
              }
            },
            { $sort: { _id: 1 } }
          ],
          earningsByMonth: [
            {
              $match: {
                attemptDate: { $gte: startOfThisYear },
                year: now.getFullYear(),
                bookingStatus: "success"
              }
            },
            {
              $group: {
                _id: "$month",
                total: { $sum: "$amount" }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      },
      {
        $project: {
          totalPendingEarnings: { $ifNull: [{ $arrayElemAt: ["$totalPendingEarnings.total", 0] }, 0] },
          totalSuccessfulEarnings: { $ifNull: [{ $arrayElemAt: ["$totalSuccessfulEarnings.total", 0] }, 0] },
          retainedFromCanceled: { $ifNull: [{ $arrayElemAt: ["$retainedFromCanceled.total", 0] }, 0] },
          totalEarnings: {
            $add: [
              { $ifNull: [{ $arrayElemAt: ["$totalSuccessfulEarnings.total", 0] }, 0] },
              { $ifNull: [{ $arrayElemAt: ["$totalPendingEarnings.total", 0] }, 0] },
              { $ifNull: [{ $arrayElemAt: ["$retainedFromCanceled.total", 0] }, 0] }
            ]
          },
          todaySuccessfulEarnings: { $ifNull: [{ $arrayElemAt: ["$todaySuccessfulEarnings.total", 0] }, 0] },
          todayPendingEarnings: { $ifNull: [{ $arrayElemAt: ["$todayPendingEarnings.total", 0] }, 0] },
          retainedFromCanceledToday: {
            $ifNull: [{ $arrayElemAt: ["$retainedFromCanceledToday.total", 0] }, 0]
          },
          todayEarnings: {
            $add: [
              { $ifNull: [{ $arrayElemAt: ["$todaySuccessfulEarnings.total", 0] }, 0] },
              { $ifNull: [{ $arrayElemAt: ["$todayPendingEarnings.total", 0] }, 0] },
              { $ifNull: [{ $arrayElemAt: ["$retainedFromCanceledToday.total", 0] }, 0] }
            ]
          },
          earningsByTwoHours: {
            $map: {
              input: Array.from({ length: 12 }, (_, i) => i),
              as: "interval",
              in: {
                $let: {
                  vars: {
                    matchedInterval: {
                      $filter: {
                        input: "$earningsByTwoHours",
                        as: "earning",
                        cond: { $eq: ["$$earning._id", "$$interval"] }
                      }
                    }
                  },
                  in: {
                    $ifNull: [{ $arrayElemAt: ["$$matchedInterval.total", 0] }, 0]
                  }
                }
              }
            }
          },
          earningsByWeek: {
            $map: {
              input: Array.from({ length: 6 }, (_, i) => i + 1),
              as: "week",
              in: {
                $let: {
                  vars: {
                    matchedWeek: {
                      $filter: {
                        input: "$earningsByWeek",
                        as: "earning",
                        cond: { $eq: ["$$earning._id", "$$week"] }
                      }
                    }
                  },
                  in: {
                    $ifNull: [{ $arrayElemAt: ["$$matchedWeek.total", 0] }, 0]
                  }
                }
              }
            }
          },
          earningsByMonth: {
            $map: {
              input: Array.from({ length: 12 }, (_, i) => i + 1),
              as: "month",
              in: {
                $let: {
                  vars: {
                    matchedMonth: {
                      $filter: {
                        input: "$earningsByMonth",
                        as: "earning",
                        cond: { $eq: ["$$earning._id", "$$month"] }
                      }
                    }
                  },
                  in: {
                    $ifNull: [{ $arrayElemAt: ["$$matchedMonth.total", 0] }, 0]
                  }
                }
              }
            }
          }
        }
      }
    ];
  }
};

export default adminAggregations;
