
var db = require('../config/connection');
var collection = require('../config/collections');
var objectId = require('mongodb').ObjectId
module.exports = {
  addProduct: (product) => {
    return new Promise((resolve) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .insertOne(product)
        .then((data) => {
          // callback(data.insertedId);
          resolve(data);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },
  getAllProductsPagination: (val) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .skip((val - 1) * 10)
        .limit(10)
        .toArray();
      resolve(products);
    });
  },

  searchProducts: (search) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({
          $or: [
            { Category: { $regex: new RegExp("^" + search + ".*", "i") } },
            { Name: { $regex: new RegExp("^" + search + ".*", "i") } },
            { MRP: { $regex: new RegExp("^" + search + ".*", "i") } },
            // Add more fields as needed
          ],
        })
        .toArray();
      if (products.length) {
        resolve(products);
        console.log(products);
      } else {
        let sErr = "No such item found";
        reject(sErr);
      }
    });
  },

  getLatestProduct: () => {
    return new Promise(async (resolve, reject) => {
      let ltstProducts = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .sort({ _id: -1 }) // Sort by _id field in descending order
        .limit(3) // Limit the result to 8 documents
        .toArray();
      resolve(ltstProducts);
    });
  },

  deleteProduct: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .deleteOne({ _id: objectId(proId) })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  getProductDetails: (proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(proId) })
        .then((product) => {
          resolve(product);
        });
    });
  },

  updateProduct: (proId, proDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(proId) },
          {
            $set: {
              Name: proDetails.Name,
              Description: proDetails.Description,
              MRP: proDetails.MRP,
              Stock: proDetails.Stock,
              Category: proDetails.Category,
              picPath: proDetails.picPath,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  getCatPrdcts: (catgry) => {
    return new Promise((resolve) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ Category: catgry })
        .toArray()
        .then((data) => {
          resolve(data);
        });
    });
  },
  changeQuantity: (products) => {
    return new Promise((resolve) => {
      var bulkOperations = products.map((product) => ({
        updateOne: {
          filter: { _id: product.item, Stock: { $gt: 0 } },
          update: { $inc: { Stock: -product.quantity } },
        },
      }));

      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .bulkWrite(bulkOperations);

      resolve();
    });
  },
  getStock: (data) => {
    return new Promise(async (resolve,reject) => {
      try {
        let stock = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .findOne({ _id: objectId(data.product) });
          resolve(stock)
      } catch (error) {
        reject(error)
      }
    });
  },
};