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
      { $unwind: "$transaction.history" },
      {
        $project: {
          amount: "$transaction.history.amount",
          status: "$transaction.history.status",
          attemptDate: "$transaction.history.attemptDate",
          bookingStatus: "$bookingStatus",
          year: { $year: "$transaction.history.attemptDate" },
          month: { $month: "$transaction.history.attemptDate" },
          day: { $dayOfMonth: "$transaction.history.attemptDate" },
          twoHourInterval: {
            $floor: {
              $divide: [{ $hour: "$transaction.history.attemptDate" }, 2]
            }
          },
          weekOfMonth: {
            $ceil: {
              $divide: [
                { $add: [{ $dayOfMonth: "$transaction.history.attemptDate" }, { $subtract: [firstDayOfMonth, 1] }] },
                7
              ]
            }
          }
        }
      },
      {
        $facet: {
          totalEarnings: [
            { $match: { bookingStatus: { $in: ["success", "canceled"] } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
            { $project: { _id: 0, total: 1 } }
          ],
          todayEarnings: [
            { $match: { bookingStatus: { $in: ["success", "canceled"] }, attemptDate: { $gte: startOfToday } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
            { $project: { _id: 0, total: 1 } }
          ],
          totalPendingEarnings: [
            { $match: { status: "pending" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
            { $project: { _id: 0, total: 1 } }
          ],
          todayPendingEarnings: [
            { $match: { status: "pending", attemptDate: { $gte: startOfToday } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
            { $project: { _id: 0, total: 1 } }
          ],
          totalSuccessfulEarnings: [
            { $match: { status: "success" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
            { $project: { _id: 0, total: 1 } }
          ],
          todaySuccessfulEarnings: [
            { $match: { status: "success", attemptDate: { $gte: startOfToday } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
            { $project: { _id: 0, total: 1 } }
          ],
          earningsByTwoHours: [
            {
              $match: {
                attemptDate: { $gte: startOfToday },
                bookingStatus: { $in: ["success", "canceled"] }
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
                bookingStatus: { $in: ["success", "canceled"] }
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
                bookingStatus: { $in: ["success", "canceled"] }
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
          totalEarnings: { $ifNull: [{ $arrayElemAt: ["$totalEarnings.total", 0] }, 0] },
          todayEarnings: { $ifNull: [{ $arrayElemAt: ["$todayEarnings.total", 0] }, 0] },
          totalPendingEarnings: { $ifNull: [{ $arrayElemAt: ["$totalPendingEarnings.total", 0] }, 0] },
          todayPendingEarnings: { $ifNull: [{ $arrayElemAt: ["$todayPendingEarnings.total", 0] }, 0] },
          successfulEarnings: { $ifNull: [{ $arrayElemAt: ["$totalSuccessfulEarnings.total", 0] }, 0] },
          todaySuccessfulEarnings: { $ifNull: [{ $arrayElemAt: ["$todaySuccessfulEarnings.total", 0] }, 0] },
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
