var express = require("express");
var router = express.Router();
const adminController = require("../controllers/admin-controller");
const path = require('path');
const  multer = require('multer');

const storage = multer.diskStorage({
  destination:(req,files,cb) => {
    cb(null,'public/product-category-images')
  },
  filename:(req,file,cb)=>{
    console.log(file)
    cb(null, Date.now() + path.extname(file.originalname))
  },
  
})

const upload = multer({
  storage:storage,
  limits:{
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: function(req,file,cb){
    let filetypes = /jpeg|jpg|png/;
    let mimetype = filetypes.test(file.mimetype);
    let extname = filetypes.test(path.extname(file.originalname))
    if(mimetype && extname){
      return cb(null,true);
    }
    cb('Error:File upload only supports the following filetypes' + filetypes)
  }
})

const verifyLogin = (req, res, next) => {
  if (req.session.admin && req.session.admin.loggedIn) {
    next();
  } else {
    res.redirect("/admin/adminLogin");
  }
};

// ----------- products --------- //

router.get("/", verifyLogin, adminController.allProductsGet);

router.post("/", verifyLogin, adminController.allProductsGet);

router.post("/add-products", verifyLogin,upload.single('Image'), adminController.addProductsPost);

router.get("/delete-product/:id", verifyLogin, adminController.deleteProducts);

router.get("/edit-product/:id", verifyLogin, adminController.editProductsGet);

router.post("/edit-product/:id", verifyLogin,upload.single('Image'), adminController.editProductsPost);

// ---------------- admin login ------------- //

router.get("/adminLogin", adminController.loginGet);

router.post("/adminLogin", adminController.loginPost);

router.get("/adminLogout", verifyLogin, adminController.logoutGet);

// ---------------- all users -------------- //

router.get("/all-users", verifyLogin, adminController.allusersGet);

router.post("/all-users", verifyLogin, adminController.allusersPost);

router.get("/block-user/:id", verifyLogin, adminController.blockUserGet);

router.get("/unblock-user/:id", verifyLogin, adminController.unblockGet);

router.get("/sorted-users/:id", verifyLogin, adminController.sortedUsersGet);

// ------------------- all category ----------------- //

router.get("/view-category", verifyLogin, adminController.viewCategoryGet);

router.get("/add-category", verifyLogin, adminController.addCategoryGet);

router.post("/add-category", verifyLogin, upload.single('Image'),adminController.addCategoryPost);

router.get("/hide-category/:id", verifyLogin, adminController.hideCategoryGet);

router.get(
  "/un-hide-category/:id",
  verifyLogin,
  adminController.unhideCategoryGet
);

router.get("/edit-category/:id", verifyLogin, adminController.editCategoryGet);

router.post(
  "/edit-category/:id",upload.single('Image'),
  verifyLogin,
  adminController.editCategoryPost
);

// --------------------- all orders -------------- //

router.get("/orders", verifyLogin, adminController.ordersGet);

router.get("/status-change", verifyLogin, adminController.statusChangeGet);

router.get("/out-of-stock/:id", adminController.outOfStockGet);

// --------------- coupon Management ------------------ //

router.get('/view-coupon',verifyLogin, adminController.viewCouponGet)

router.get('/add-coupon',verifyLogin, adminController.addCouponGet)

router.post('/add-coupon',verifyLogin,adminController.addCouponPost)

router.get('/edit-coupon/:id',verifyLogin, adminController.editCouponGet)

router.post('/edit-coupon',verifyLogin, adminController.editCouponPost)

router.post('/delete-coupon',verifyLogin, adminController.deleteCouponPost)

// ************* dash board ************* //

router.get('/dash-board',verifyLogin,adminController.dashbordget)

router.post('/filter',verifyLogin,adminController.dashFilter)

router.get('/sales',verifyLogin,adminController.salesReport)

router.post('/date-filter',verifyLogin,adminController.dateFilter)

router.get('/download',verifyLogin,adminController.salesReportPost)

module.exports = router;
