
var express = require("express");
var router = express.Router();
const userController = require("../controllers/user-controller");
const path = require('path');
const  multer = require('multer');
const { verify } = require("crypto");


const storage = multer.diskStorage({
  destination:(req,files,cb) => {
    cb(null,'public/images')
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



const verifyLogin = async (req, res, next) => {
  if (req.session.user) {
    let cartCount = await userController.cartCount(req.session.user._id)
    req.session.user.cartCount = cartCount
    next();
  } else {
    res.redirect("/login");
  }
};

// ************ User Login and Sign Up related routes ********** //

router.get("/", userController.landingPage);

router.get("/cat-products",userController.catWiseProducts)

router.get("/signup", userController.signupGet);  

router.post("/signup", userController.signupPost);

router.post("/otp", userController.otpPost);

router.get("/login", userController.loginGet);

router.post("/login", userController.loginPost);

router.get("/logout", userController.logoutGet);

router.get("/forgot-password-otp",userController.frgtPasswordGet)

router.post("/forgot-password-otp",userController.frgtOtpValidation)

// ************ user Profile ******//

router.get("/user-profile", verifyLogin, userController.userProfileGet);

router.post("/add-address", verifyLogin, userController.addAddressPost);

router.get("/change-password", verifyLogin, userController.changePasswordGet);

router.post("/change-password", verifyLogin, userController.changePasswordPost);

router.post('/profile-image-change', upload.single('proPic'),userController.addProfileImage)


//  ********** cart ********** //


router.get("/cart", verifyLogin, userController.cartGet);

router.post('/apply-coupon',verifyLogin,userController.applyCouponPost)

router.post('/getCoupon',userController.getCouponDetails)

router.post('/use-wallet',verifyLogin,userController.useWalletPost)

router.get("/add-to-cart/:id", verifyLogin, userController.addToCartGet);

router.post(
  "/change-product-quantity",
  verifyLogin,
  userController.chngPrdctQntyPost
);

router.post( 
  "/remove-product-cart",
  verifyLogin,
  userController.removeProductCartPost
);

// ****************** Adress **************** //


router.get("/use-address", verifyLogin, userController.useAddressGet);

router.post("/add-new-address", verifyLogin, userController.addNewAddressPost);

router.get("/edit-address", verifyLogin, userController.editAddressGet);

router.post("/edit-address", verifyLogin, userController.editAddressPost);

router.get("/delete-address", verifyLogin, userController.deleteAddressGet);

router.get('/delete-delivery-address',verifyLogin,userController.deleteAddress);


// ************* Product Related routes ************ //


router.get("/productdetails/:id",verifyLogin, userController.productDetailsGet);

router.get("/all-products", userController.allProductsGet);


// ************* Order Management ************* //


router.get("/delivery-address", verifyLogin, userController.deliveryAddressGet);

router.post(
  "/delivery-address",
  verifyLogin,
  userController.deliveryAddressPost  
);

router.post('/verify-payment', userController.verifyPayment);

router.get("/order-succesful", verifyLogin, userController.orderSuccesfulGet);

router.get('/user-orders',verifyLogin, userController.userOrder);

router.get('/view-products',verifyLogin, userController.viewOrderDetailsGet)

router.get("/status-change", verifyLogin, userController.statusChangeGet);

router.get('/return-order',verifyLogin,userController.returnOrder)

router.post('/generate-pdf',userController.dowloadInvoice)

module.exports = router;
