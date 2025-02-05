import { PipelineStage } from "mongoose";
import { getWeek } from "../utils/dateUtils";

const adminAggregations = {
  getRevenue: (today: Date): PipelineStage[] => [
    {
      $facet: {
        totalEarnings: [
          {
            $match: {
              bookingStatus: "success",
              "transaction.paymentStatus": "paid"
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$transaction.history.amount" },
              todayTotal: {
                $sum: {
                  $cond: [{ $gte: ["$createdAt", today] }, "$transaction.history.amount", 0]
                }
              }
            }
          }
        ],

        bookingStats: [
          {
            $group: {
              _id: null,
              totalBookings: { $sum: 1 },
              todayBookings: {
                $sum: {
                  $cond: [{ $gte: ["$createdAt", today] }, 1, 0]
                }
              },
              pendingBookings: {
                $sum: {
                  $cond: [{ $eq: ["$bookingStatus", "init"] }, 1, 0]
                }
              },
              todayPendingBookings: {
                $sum: {
                  $cond: [
                    {
                      $and: [{ $eq: ["$bookingStatus", "init"] }, { $gte: ["$createdAt", today] }]
                    },
                    1,
                    0
                  ]
                }
              }
            }
          }
        ]
      }
    },
    {
      $project: {
        totalEarnings: { $arrayElemAt: ["$totalEarnings.total", 0] },
        todayEarnings: { $arrayElemAt: ["$totalEarnings.todayTotal", 0] },
        totalBookings: { $arrayElemAt: ["$bookingStats.totalBookings", 0] },
        todayBookings: { $arrayElemAt: ["$bookingStats.todayBookings", 0] },
        pendingBookings: { $arrayElemAt: ["$bookingStats.pendingBookings", 0] },
        todayPendingBookings: { $arrayElemAt: ["$bookingStats.todayPendingBookings", 0] }
      }
    }
  ],

  getRevenueWithDuration: (now: Date): PipelineStage[] => [
    {
      $match: {
        bookingStatus: "success",
        createdAt: {
          $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    },
    {
      $group: {
        _id: {
          weekly: { $week: "$createdAt" },
          monthly: { $month: "$createdAt" },
          hourly: { $hour: "$createdAt" }
        },
        weeklyEarnings: {
          $sum: {
            $cond: [{ $eq: ["$_id.weekly", getWeek(now)] }, "$transaction.history.amount", 0]
          }
        },
        monthlyEarnings: {
          $sum: {
            $cond: [{ $eq: ["$_id.monthly", now.getMonth() + 1] }, "$transaction.history.amount", 0]
          }
        },
        hourlyEarnings: {
          $sum: {
            $cond: [{ $eq: ["$_id.hourly", now.getHours()] }, "$transaction.history.amount", 0]
          }
        }
      }
    }
  ]
};

export default adminAggregations;
