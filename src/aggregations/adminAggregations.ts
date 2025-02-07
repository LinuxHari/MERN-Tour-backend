import { PipelineStage } from "mongoose";

const adminAggregations = {
  getEarnings: (): PipelineStage[] => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);
    const startOfLast5Weeks = new Date(now.getTime() - 5 * 7 * 24 * 60 * 60 * 1000);

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
          hour: { $hour: "$transaction.history.attemptDate" },
          week: { $week: "$transaction.history.attemptDate" }
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
            {
              $match: {
                bookingStatus: { $in: ["success", "canceled"] },
                attemptDate: { $gte: startOfToday }
              }
            },
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
          successfulEarnings: [
            { $match: { status: "success" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
            { $project: { _id: 0, total: 1 } }
          ],
          successfulEarningsToday: [
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
                _id: { $subtract: ["$hour", { $mod: ["$hour", 2] }] },
                total: { $sum: "$amount" }
              }
            }
          ],
          earningsByWeek: [
            {
              $match: {
                attemptDate: { $gte: startOfLast5Weeks },
                bookingStatus: { $in: ["success", "canceled"] }
              }
            },
            { $group: { _id: "$week", total: { $sum: "$amount" } } }
          ],
          earningsByMonth: [
            {
              $match: {
                attemptDate: { $gte: startOfThisYear },
                bookingStatus: { $in: ["success", "canceled"] }
              }
            },
            { $group: { _id: "$month", total: { $sum: "$amount" } } }
          ]
        }
      },
      {
        $project: {
          totalEarnings: { $ifNull: [{ $arrayElemAt: ["$totalEarnings.total", 0] }, 0] },
          todayEarnings: { $ifNull: [{ $arrayElemAt: ["$todayEarnings.total", 0] }, 0] },
          totalPendingEarnings: {
            $ifNull: [{ $arrayElemAt: ["$totalPendingEarnings.total", 0] }, 0]
          },
          todayPendingEarnings: {
            $ifNull: [{ $arrayElemAt: ["$todayPendingEarnings.total", 0] }, 0]
          },
          successfulEarnings: { $ifNull: [{ $arrayElemAt: ["$successfulEarnings.total", 0] }, 0] },
          successfulEarningsToday: {
            $ifNull: [{ $arrayElemAt: ["$successfulEarningsToday.total", 0] }, 0]
          },

          earningsByTwoHours: {
            $map: {
              input: Array.from({ length: 12 }, (_, i) => i * 2),
              as: "hour",
              in: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$earningsByTwoHours",
                              as: "e",
                              cond: { $eq: ["$$e._id", "$$hour"] }
                            }
                          },
                          as: "filtered",
                          in: "$$filtered.total"
                        }
                      },
                      0
                    ]
                  },
                  0
                ]
              }
            }
          },

          earningsByWeek: {
            $map: {
              input: Array.from({ length: 5 }, (_, i) => i + 1),
              as: "week",
              in: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$earningsByWeek",
                              as: "w",
                              cond: { $eq: ["$$w._id", "$$week"] }
                            }
                          },
                          as: "filtered",
                          in: "$$filtered.total"
                        }
                      },
                      0
                    ]
                  },
                  0
                ]
              }
            }
          },

          earningsByMonth: {
            $map: {
              input: Array.from({ length: 12 }, (_, i) => i + 1),
              as: "month",
              in: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$earningsByMonth",
                              as: "m",
                              cond: { $eq: ["$$m._id", "$$month"] }
                            }
                          },
                          as: "filtered",
                          in: "$$filtered.total"
                        }
                      },
                      0
                    ]
                  },
                  0
                ]
              }
            }
          }
        }
      }
    ];
  }
};

export default adminAggregations;
