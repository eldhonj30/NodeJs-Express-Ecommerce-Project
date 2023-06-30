var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
var alert = require("alert");
const objectId = require("mongodb").ObjectId;
const Razorpay = require('razorpay');
const { resolve } = require("path");
const { ObjectId } = require("mongodb");



var instance = new Razorpay({
  key_id: "rzp_test_iyylIT7Y6TskoN",
  key_secret: "zvQOKBUsqPJLVJhhiTlulBJ3",
});


module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      let userExist = await db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .findOne({ email: userData.email });
      if (!userExist) {
        resolve(userExist);
      } else {
        resolve(1);
      }
    });
  },
  addUser: (userData) => {
    return new Promise(async (resolve) => {
      if (!userData.password || userData.password.trim() === "") {
        reject(new Error("Password field is required"));
        return;
      }

      try {
        userData.password = await bcrypt.hash(userData.password, 10);
        const data = await db
          .get()
          .collection(collection.USER_COLLECTIONS)
          .insertOne(userData);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};

      let user = await db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .findOne({ email: userData.email });

      if (user) {
        if (!user.isBlocked) {
          bcrypt.compare(userData.password, user.password).then((status) => {
            if (status) {
              console.log("login success");
              response.user = user;
              response.status = true;
              resolve(response);
            } else {
              console.log("login fail");
              resolve({ status: false });
            }
          });
        } else {
          console.log("you are blocked");
          resolve(1);
        }
      } else {
        console.log("login failed");
        resolve({ status: false });
      }
    });
  },
  addToCart: async (proId, userId) => {

    let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)})

    let proObj = {
      item: objectId(proId),
      quantity: 1,
      name:product.Name,
      category:product.Category,
      price:product.MRP
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );
        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId), "products.item": objectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve(response);
          });
      }
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              name: "$products.name",
              quantity: "$products.quantity",
              category:"$products.category",
              price:"$products.price"
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              name:1,
              quantity: 1,
              category: 1,
              price:1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },

  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (cart) {
        count = cart.products.length;
        console.log(count);
      }
      resolve(count);
    });
  },

  changeProductQuantity: (details) => { 
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);
    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectId(details.cart) },
            {
              $pull: { products: { item: objectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: objectId(details.cart),
              "products.item": objectId(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },

  removeFromCart: (details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: objectId(details.cart) },
          {
            $pull: { products: { item: objectId(details.product) } },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: {
                $mergeObjects: [
                  "$product",
                  { MRP: { $toInt: "$product.MRP" } },
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.MRP"] } },
            },
          },
        ])
        .toArray();
      if (total.length) {
        resolve(total[0].total);
      } else {
        let total = 0;
        resolve(total);
      }
    });
  },
  userDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .findOne({ _id: objectId(userId) });
      resolve(user);
    });
  },
  placeOrder: (order, products, total) => { 
    return new Promise((resolve) => {
      const currDate = new Date();
      const dateStirng = currDate.toLocaleDateString();
      
      for(let i=0;i<products.length;i++){
        products[i].status = "placed"
      }
      let orderObj = {
        deliveryDetails: {
          fullName: order.fullName,
          mobileNo: order.mobileNo,
          address: order.address,
          zipCode: order.zipCode,
        },
        userId: objectId(order.userId),
        paymentMethod: order["payment-method"],
        products: products,
        totalAmount: total,
        pDate: dateStirng,
        date: new Date(),
      };
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .deleteOne({ user: objectId(order.userId) });
          resolve(response.insertedId);
        });
    });
  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });

      resolve(cart.products);
    });
  },

  addNewAddress: (userId, address) => {
    return new Promise(async (resolve, reject) => {
      const userAddressCollection = db
        .get()
        .collection(collection.USER_ADDRESS_COLLECTION);
      const userAddress = {
        userId: userId,
        address: address,
      };
      await userAddressCollection
        .insertOne(userAddress)
        .then(() => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  getUserAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      const addresses = await db
        .get()
        .collection(collection.USER_ADDRESS_COLLECTION)
        .find({ userId: userId })
        .toArray();

      if (addresses) {
        resolve(addresses);
      } else {
        resolve("empty");
      }
    });
  },
  getOneAddress: (id) => {
    return new Promise(async (resolve, reject) => {
      const address = await db
        .get()
        .collection(collection.USER_ADDRESS_COLLECTION)
        .findOne({ _id: objectId(id) });

      if (address) {
        resolve(address);
      } else {
        resolve("empty");
      }
    });
  },
  editAddress: (Id, address) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db
          .get()
          .collection(collection.USER_ADDRESS_COLLECTION)
          .updateOne(
            { _id: objectId(Id) },
            {
              $set: {
                address,
              },
            },
            { upsert: false }
          );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  deleteAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.USER_ADDRESS_COLLECTION)
        .deleteOne({ _id: objectId(userId) })
        .then((response) => {
          resolve({ removeAddress: true });
        });
    });
  },
  getUserOrders: (userId) => {
    return new Promise(async (resolve) => {
      let orderDetails = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: objectId(userId) })
        .sort({ _id: -1 })
        .toArray();
      resolve(orderDetails);
    });
  },
  cancelOrder: (orderId, status,item) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne({ _id: objectId(orderId),"products.item":objectId(item)}, { $set: {  "products.$.status": status } });
      resolve();
    });
  },
  changePassword: (userId, newPassword, oldPassword) => {
    oldPassword.trim() === "";
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTIONS)
        .findOne({ _id: objectId(userId) });
      let status = await bcrypt.compare(oldPassword, user.password);
      if (status) {
        console.log("password verified");
        newPassword.trim() === "";
        newPassword = await bcrypt.hash(newPassword, 10);
        const response = await db
          .get()
          .collection(collection.USER_COLLECTIONS)
          .updateOne(
            { _id: objectId(userId) },
            { $set: { password: newPassword } }
          );
        resolve(response);
      } else {
        console.log("Passwod is incorrect");
        let err = "Passwod is incorrect";
        reject(err);
      }
    });
  },

  proDetails: (orderId) => {
    return new Promise(async (resolve) => {
      let proDetails = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          { $match: { _id: objectId(orderId) } },
          { $unwind: "$products" },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();

      resolve(proDetails);
    });
  },
  getOrder: (id) => {
    return new Promise(async (resolve) => {
      let order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: objectId(id) });
      resolve(order);
    });
  },

  addProImg: (id, picPath) => {
    return new Promise((resolve) => {
      db.get()
        .collection(collection.USER_COLLECTIONS)
        .updateOne({ _id: objectId(id) }, { $set: { profileImage: picPath } })
        .then((result) => {
          resolve(result);
        });
    });
  },

  generateRazorpay: ( total) => {
  
    return new Promise((resolve) => {
      var options = {
        amount: total * 100,
        currency: "INR",
        receipt : "order_123"
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          console.log(order)
          resolve(order);
        }
      });
    });
  },
  verifyPayment: (details) => {
    console.log(details)
    return new Promise((resolve,reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "zvQOKBUsqPJLVJhhiTlulBJ3");

      hmac.update(
        details['payment[razorpay_order_id]'] +
          "|" +
          details['payment[razorpay_payment_id]']
      );
      hmac = hmac.digest("hex");
      if (hmac == details['payment[razorpay_signature]']) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changePaymentStatus: (orderId) => {
    console.log(orderId);
    return new Promise((resolve) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne({ _id: objectId(orderId) }, { $set: { status: "placed" } })
        .then(() => {
          resolve();
        });
    });
  },
  addCouponUser: (userId, coupon) => {
    return new Promise(async (resolve, reject) => {
      let coupons = await db.get().collection(collection.USER_COLLECTIONS)
      .aggregate([
        { $match: { _id: ObjectId (userId) } },
        { $unwind: "$couponCodes" },
        { $match: { "couponCodes.coupon": coupon } },
      ]).toArray();
    
      if (coupons.length) {
        db.get()
          .collection(collection.USER_COLLECTIONS)
          .updateOne(
            { _id: objectId(userId), "couponCodes.coupon": coupon },
            { $inc: { "couponCodes.$.count": 1 } }
          );
      } else {
        db.get()
          .collection(collection.USER_COLLECTIONS)
          .updateOne(
            { _id: objectId(userId) },
            { $push: { couponCodes: { coupon, count: 1 } } }
          )
          .then(() => {
            resolve();
          });
      }
    });
  },
  deleteCoupon: (userId, usedCoupon) => {
    return new Promise(async (resolve, reject) => {
      try {
        const userCollection = await db.get()
        .collection(collection.USER_COLLECTIONS)
        .updateOne(
          { _id: objectId(userId), "couponCodes.coupon": usedCoupon },
          { $inc: { "couponCodes.$.count": -1 } }
        );

        resolve(userCollection);
      } catch (error) {
        reject(error);
      }
    });
  },
  addAmountWallet: (amount, userId) => {
    db.get()
      .collection(collection.USER_COLLECTIONS)
      .updateOne({ _id: objectId(userId) }, { $inc: { walletAmount: amount } });
  },
  deductAmountWallet:(amount, userId) => {
    db.get()
      .collection(collection.USER_COLLECTIONS)
      .updateOne({ _id: objectId(userId) }, { $set: { walletAmount: amount } });
  },
  getOrderData:(id) => {
    return new Promise( async (resolve)=>{
     let orders = await db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(id)})
     resolve(orders)
    })
  }
};
