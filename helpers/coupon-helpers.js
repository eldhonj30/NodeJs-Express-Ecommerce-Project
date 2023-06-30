
var db=require("../config/connection");
var collection=require("../config/collections");
const bcrypt=require('bcrypt');
const objectId=require("mongodb").ObjectId;
const { ObjectId } = require("mongodb");


module.exports = {
  addcoupon: (data) => {
    return new Promise((resolve) => {
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .insertOne(data)
        .then((response) => {
          resolve(response);
        });
    });
  },
  getCoupons: () => {
    return new Promise(async (resolve) => {
      let coupons = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find({})
        .toArray();
      resolve(coupons);
    });
  },
  getOneCoupon: (id) => {
    return new Promise(async (resolve, reject) => {
      let coupon = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ _id: objectId(id) });
      resolve(coupon);
    });
  },
  editCoupon: (id, data) => {
    return new Promise(async (resolve) => {
      let response = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .updateOne(
          { _id: objectId(id) },
          {
            $set: {
              couponCode: data.couponCode,
              expiryDate: data.expiryDate,
              discount: data.discount,
              minPurchase: data.minPurchase,
              maxAmount: data.maxAmount
            },
          }
        );
      resolve(response);
    });
  },
  deleteCoupon:(id)=>{
    return new Promise((resolve)=>{
      db.get().collection(collection.COUPON_COLLECTION).deleteOne({_id:objectId(id)}).then((data)=>{
        resolve(data)
      })
    })
  },
  giveCoupon:(price)=>{
    return new Promise(async(resolve)=>{
      let coupon = await db
      .get()
      .collection(collection.COUPON_COLLECTION)
      .find({ $expr: { $lt: [{ $toInt: "$maxPuchase" }, price] } })
      .sort({ maxPurchase: 1 })
      .limit(1)
      .toArray();
  
      if(coupon.length){
        resolve(coupon[0].couponCode)
      }else{
        resolve(null)
      }
    })
  },
  applyCoupon:(couponCode) =>{
    return new Promise(async(resolve)=>{
      let userCoupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({couponCode:couponCode}) 
      resolve(userCoupon)
    })
   }
};