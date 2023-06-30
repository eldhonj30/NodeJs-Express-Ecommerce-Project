var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectId;
const { ObjectId } = require("mongodb");
// const { use } = require('../routes/admin')

const moment = require("moment");

module.exports = {
  doLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      console.log(adminData.Email);
      let admin = await db
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .findOne({ email: adminData.Email });
      console.log(admin);
      if (admin) {
        bcrypt.compare(adminData.Password, admin.password).then((status) => {
          if (status) {
            console.log("login success");
            response.admin = admin;
            response.status = true;
            resolve(response);
          } else {
            console.log("login failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("login failed");
        resolve({ status: false });
      }
    });
  },
  getAllUsers: (val) => {
    console.log(val);
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .find()
        .skip((val - 1) * 10)
        .limit(10)
        .toArray();
      resolve(users);
    });
  },

  totalUser: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTIONS)
        .countDocuments({}, (err, count) => {
          if (err) {
            reject(err);
          }
          resolve(count);
        });
    });
  },
  getSortedUsers: (pData, cat) => {
    console.log(pData);
    console.log(cat);
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .find({ cat: { $in: pData } })
        .sort({ cat: -1 })
        .limit(10)
        .toArray();
      resolve(users);
    });
  },
  blockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .updateOne(
          { _id: objectId(userId) },
          { $set: { isBlocked: true } },
          (err, res) => {
            if (err) {
              console.log("error :" + err);
              res.status(500).send("Error blocking");
            } else {
              resolve("success");
            }
          }
        );
    });
  },
  unBlockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .updateOne(
          { _id: objectId(userId) },
          { $set: { isBlocked: false } },
          (err, res) => {
            if (err) {
              console.log("error :" + err);
              res.status(500).send("Error blocking");
            } else {
              console.log("User Unblocked");
              resolve("success");
            }
          }
        );
    });
  },
  searchAllUsers: (search) => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .find({
          $or: [
            { username: { $regex: new RegExp("^" + search + ".*", "i") } },
            { email: { $regex: new RegExp("^" + search + ".*", "i") } },
            { number: { $regex: new RegExp("^" + search + ".*", "i") } },
            // Add more fields as needed
          ],
        })
        .toArray();
      if (users.length) {
        resolve(users);
      } else {
        let sErr = "Sorry! No such item found";
        reject(sErr);
      }
    });
  },
  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({})
        .toArray();
      resolve(orders);
    });
  },

  cancelOrder: (orderId, status, item) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId), "products.item": objectId(item) },
          { $set: { "products.$.status": status } }
        );
      resolve();
    });
  },

  delivered: (orderId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(orderId) },
          { $set: { status: "Delivered" } }
        );
      resolve();
    });
  },

  getCatSales: () => {
    return new Promise(async (resolve, reject) => {
      const data = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          { $project: { products: 1 } },
          { $unwind: { path: "$products" } },
        ])
        .toArray();

      const categoryCount = {};

      for (const item of data) {
        const category = item.products.category;

        if (categoryCount.hasOwnProperty(category)) {
          categoryCount[category]++;
        } else {
          categoryCount[category] = 1;
        }
      }

      resolve(categoryCount);
    });
  },
  // sales report start //

  getAmountLastSevenDay: () => {
    console.log("hai")
    return new Promise(async (resolve, reject) => {
      const sevenDaysAgo = moment().subtract(7, "days").toDate();

      try {
        const totalPrize = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            {
              $match: {
                date: {
                  $gte: sevenDaysAgo,
                },
              },
            },
            {
              $group: {
                _id: null,
                totalPrize: {
                  $sum: "$totalAmount",
                },
              },
            },
          ])
          .toArray();

        if (totalPrize.length > 0) {
          resolve(totalPrize[0].totalPrize);
        } else {
          resolve(0); // No orders found in the last seven days
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  getAmountLastMonth: () => {
    return new Promise(async (resolve, reject) => {
      const sevenDaysAgo = moment().subtract(30, "days").toDate();

      let totalPrize = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              date: {
                $gte: sevenDaysAgo,
              },
            },
          },
          {
            $group: {
              _id: null,
              totalPrize: {
                $sum: "$totalAmount",
              },
            },
          },
        ])
        .toArray();
      
      resolve(totalPrize[0].totalPrize);
    });
  },
  getAmountLastYear: () => {
    return new Promise(async (resolve, reject) => {
      const sevenDaysAgo = moment().subtract(360, "days").toDate();

      let totalPrize = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              date: {
                $gte: sevenDaysAgo,
              },
            },
          },
          {
            $group: {
              _id: null,
              totalPrize: {
                $sum: "$totalAmount",
              },
            },
          },
        ])
        .toArray();
     
      resolve(totalPrize[0].totalPrize);
    });
  },
  getTotalProductQuantityLastSevenDays: () => {
    return new Promise(async (resolve, reject) => {
      const sevenDaysAgo = moment().subtract(7, "days").toDate();
      try {
        const result = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .aggregate([
            {
              $match: {
                Date: {
                  $gte: sevenDaysAgo
                }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 }
              }
            }
          ]).toArray()

        // Extract the total quantity from the result
        const totalQuantity = result.length > 0 ? result[0].count : 0;
        resolve(totalQuantity);
      } catch (error) {
        reject(error);
      }
    });
  },
  getTotalProductQuantityLastMonth: () => {
    return new Promise(async (resolve, reject) => {
      const month = moment().subtract(30, "days").startOf("day").toDate();
      try {
        const result = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .aggregate([
            {
              $match: {
                Date: {
                  $gte: month
                }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 }
              }
            }
          ]).toArray()

        // Extract the total quantity from the result
        const totalQuantity = result.length > 0 ? result[0].count : 0;

        resolve(totalQuantity);
      } catch (error) {
        reject(error);
      }
    });
  },
  getTotalProductQuantityLastYear: () => {
    return new Promise(async (resolve, reject) => {
      const year = moment().subtract(360, "days").startOf("day").toDate();

      try {
        const result = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .aggregate([
            {
              $match: {
                Date: {
                  $gte: year
                }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 }
              }
            }
          ]).toArray()

        // Extract the total quantity from the result
        const totalQuantity = result.length > 0 ? result[0].count : 0;
        console.log(totalQuantity);

        resolve(totalQuantity);
      } catch (error) {
        reject(error);
      }
    });
  },

  getOrderLastSevenDay: () => {
    return new Promise(async (resolve, reject) => {
      const startDate = moment().subtract(7, "days").startOf("day").toDate();
      const endDate = moment().endOf("day").toDate();

      try {
        const orderCount = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .countDocuments({
            date: {
              $gte: startDate,
              $lte: endDate,
            },
          });
        resolve(orderCount);
      } catch (error) {
        reject(error);
      }
    });
  },
  getOrderLastMonth: () => {
    return new Promise(async (resolve, reject) => {
      const startDate = moment().subtract(30, "days").startOf("day").toDate();
      const endDate = moment().endOf("day").toDate();

      try {
        const orderCount = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .countDocuments({
            date: {
              $gte: startDate,
              $lte: endDate,
            },
          });
        resolve(orderCount);
      } catch (error) {
        reject(error);
      }
    });
  },
  getOrderLastYear: () => {
    return new Promise(async (resolve, reject) => {
      const startDate = moment().subtract(360, "days").startOf("day").toDate();
      const endDate = moment().endOf("day").toDate();

      try {
        const orderCount = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .countDocuments({
            date: {
              $gte: startDate,
              $lte: endDate,
            },
          });
       
        resolve(orderCount);
      } catch (error) {
        reject(error);
      }
    });
  },
  // for sales report //
  orderDelivered: () => {
    return new Promise(async (resolve, reject) => {
    
      try {
        const orderCount = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            {
              $unwind: "$products",
            },
            {
              $match: {
                "products.status": "Delivered",
              },
            },
          ]).toArray();
        resolve(orderCount);
      } catch (error) {
        reject(error);
      }
    });
  },
  orderLastWeek: () => {
    return new Promise(async (resolve, reject) => {
      const startDate = moment().subtract(7, "days").startOf("day").toDate();
      const endDate = moment().endOf("day").toDate();

      try {
        const orderCount = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            {
              $unwind: "$products",
            },
            {
              $match: {
                "products.status": "Delivered",
                date: {
                  $gte: startDate,
                  $lte: endDate,
                },
              },
            },
          ]).toArray();
        resolve(orderCount);
      } catch (error) {
        reject(error);
      }
    });
  },
  orderLastMonth:() => {
    return new Promise(async (resolve, reject) => {
      const startDate = moment().subtract(30, "days").startOf("day").toDate();
      const endDate = moment().endOf("day").toDate();

      try {
        const orderCount = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            {
              $unwind: "$products",
            },
            {
              $match: {
                "products.status": "Delivered",
                date: {
                  $gte: startDate,
                  $lte: endDate,
                },
              },
            },
          ]).toArray();
        resolve(orderCount);
      } catch (error) {
        reject(error);
      }
    });
  },
  orderLastYear:() => {
    return new Promise(async (resolve, reject) => {
      const startDate = moment().subtract(365, "days").startOf("day").toDate();
      const endDate = moment().endOf("day").toDate();

      try {
        const orderCount = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            {
              $unwind: "$products",
            },
            {
              $match: {
                "products.status": "Delivered",
                date: {
                  $gte: startDate,
                  $lte: endDate,
                },
              },
            },
          ]).toArray();
        resolve(orderCount);
      } catch (error) {
        reject(error);
      }
    });
  },
  // date filter
  orderInDate:(startDate,endDate) => {
    
    return new Promise(async (resolve, reject) => {
      try {
        const orders = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            {
              $unwind: "$products",
            },
            {
              $match: {
                "products.status": "Delivered",
                date: {
                  $gte: startDate,
                  $lte: endDate,
                },
              },
            },
          ]).toArray();
        resolve(orders);
      } catch (error) {
        reject(error);
      }
    })
  },
  getUserInLastSevenDay: () => {
    return new Promise(async (resolve, reject) => {
      const sevenDaysAgo = moment().subtract(7, "days").toDate();
      db.get()
        .collection(collection.USER_COLLECTIONS)
        .aggregate([
          {
            $match: {
              date: {
                $gte: sevenDaysAgo,
              },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
            },
          },
        ])
        .toArray()
        .then((result) => {
          const userCount = result.length > 0 ? result[0].count : 0;

          resolve(userCount);
        })
        .catch((error) => {
          console.log("Error:", error);
        });
    });
  },
  getUserInLastMonth: () => {
    return new Promise(async (resolve, reject) => {
      const sevenDaysAgo = moment().subtract(30, "days").toDate();
      db.get()
        .collection(collection.USER_COLLECTIONS)
        .aggregate([
          {
            $match: {
              date: {
                $gte: sevenDaysAgo,
              },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
            },
          },
        ])
        .toArray()
        .then((result) => {
          const userCount = result.length > 0 ? result[0].count : 0;

          resolve(userCount);
        })
        .catch((error) => {
          console.log("Error:", error);
        });
    });
  },
  getUserInLastYear: () => {
    return new Promise(async (resolve, reject) => {
      const sevenDaysAgo = moment().subtract(360, "days").toDate();
      db.get()
        .collection(collection.USER_COLLECTIONS)
        .aggregate([
          {
            $match: {
              date: {
                $gte: sevenDaysAgo,
              },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
            },
          },
        ])
        .toArray()
        .then((result) => {
          const userCount = result.length > 0 ? result[0].count : 0;

          resolve(userCount);
        })
        .catch((error) => {
          console.log("Error:", error);
        });
    });
  },
  totalAmount: () => {
    return new Promise(async (resolve, reject) => {
      let result = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$totalAmount" },
              totalOrders: { $sum: 1 },
            },
          },
        ])
        .toArray();

      // Access the total amount and total orders from the result
      const totalAmount = result[0].totalAmount;
      const totalOrders = result[0].totalOrders;
      resolve({ totalAmount, totalOrders });
    });
  },

  // sales report end //
  // dashbord mnagement  start//
  getAllLatestOrders: () => {
    return new Promise(async (resolve, reject) => {
      let usersOrders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({})
        .sort({ _id: -1 }) // Sort by descending order of _id (assuming _id represents the order creation timestamp)
        .limit(5) // Limit the result to 5 documents
        .toArray();

      resolve(usersOrders);
    });
  },

  getAllLatestUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .find({})
        .sort({ _id: -1 }) // Sort by descending order of _id (assuming _id represents the user creation timestamp)
        .limit(5) // Limit the result to 5 documents
        .toArray();

      resolve(users);
    });
  },

  totalProduct: () => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .countDocuments({}, (err, count) => {
          if (err) {
            reject(err);
          }
          // Access the total count of products
          resolve(count);
        });
    });
  },

  getSellingProductInEachMonth: () => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $group: {
              _id: { $month: { $toDate: "$date" } },
              totalAmount: { $sum: "$totalAmount" },
            },
          },
        ])
        .toArray((err, result) => {
          if (err) {
            console.error(err);
            reject(err);
            return;
          }

          const totalAmounts = result.map((item) => item.totalAmount);
          resolve(totalAmounts);
        });
    });
  },
  paymentMethodCount: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const codCount = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .countDocuments({ paymentMethod: "COD" });
  
        const onlineCount = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .countDocuments({ paymentMethod: "online" });
  
        resolve({ codCount, onlineCount });
      } catch (error) {
        reject(error);
      }
    });
  },
  //  dashbord mangement end //
};
