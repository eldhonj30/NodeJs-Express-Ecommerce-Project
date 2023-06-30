var db=require('../config/connection')
var collection=require('../config/collections')
const { request } = require('../app')
var objectId=require('mongodb').ObjectId

module.exports={
    addCategory:(category)=>{
        return new Promise(async (resolve,reject)=>{
            let catExist = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({Category:category.Category})
         
            if(!catExist){

                let data = await db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category)

                resolve(data);
                
            } else {
                let data = false
                resolve(data)
            }
        })
  
    },
    getAllCategory:()=>{
        return new Promise(async(resolve,reject)=>{
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })
    }, 
    hideCategory:(cateId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(cateId)},{$set:{isHide:true}},(err,res)=>{
                if(err){
                  console.log("error :"+err)
                  res.status(500).send("Error blocking")
              }else{
                  console.log('category hided')
                  resolve("success")
                  
              }
              })
        })
    },
    unHideCategory:(cateId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(cateId)},{$set:{isHide:false}},(err,res)=>{
                if(err){
                  console.log("error :"+err)
                  res.status(500).send("Error blocking")
              }else{
                  console.log('category unhided')
                  resolve("success")
                  
              }
              })
        })
    },
    getCategoryDetails:(cateId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(cateId)}).then((category)=>{
                resolve(category)
            })
        })
    },
    
    updateCategory:(cateId,cateDetails)=>{
        return new Promise(async (resolve,reject)=>{
            let catExist = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({Category:cateDetails.Category})
            if(!catExist){
                db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(cateId)},{
                    $set:{
                        Category:cateDetails.Category,
                        picPath:cateDetails.picPath
                    }
                }).then((response)=>{
                    resolve(response)
                })
            } else {
                let response = false;
                resolve(response);
            }
           
                
        })
    }
}