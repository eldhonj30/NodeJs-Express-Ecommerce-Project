const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
// const alert = require("alert");
const categoryHelpers = require("../helpers/category-helpers");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const { response } = require("../app");
const { log } = require("handlebars");
const couponHelpers = require("../helpers/coupon-helpers");
var easyinvoice = require('easyinvoice');



module.exports = {
  
  userDetails: async (id) =>{
    let userLive = await userHelpers.userDetails(id);
    return userLive
  },

  cartCount: async (id) => {
    let cartCount = 0;
    cartCount = await userHelpers.getCartCount(id);
    return cartCount;
  },

  // ************ User Login and Sign Up related routes ********** //

  landingPage: async (req, res) => {
    let user = req.session.user;
    let cartCount = 0;
    if (user) {
      cartCount = await userHelpers.getCartCount(user._id);
      req.session.user.cartCount = cartCount;
    }
    productHelpers.getLatestProduct().then((products) => {
      categoryHelpers.getAllCategory().then((details) => {
        res.render("user/Landing-page", {
          user,
          products,
          details,
          guest: true,
        });
      });
    });
  },
  catWiseProducts : async (req,res)=>{
    let catgry = req.query.cat
    let user = req.session.user
    let Products = await productHelpers.getCatPrdcts(catgry)
    res.render("user/category-products",{Products,user,guest:true})
  },

  signupGet: (req, res) => {
    let otpError  = req.session.otpError
    res.render("user/signup", { loginError: req.session.loginError,otpError });

    req.session.loginError = false;
  },

  signupPost: (req, res) => {
    userHelpers.doSignup(req.body).then((response) => {
      if (response == 1) {
        req.session.loginError = "Email Already Used";
        res.redirect("/signup");
      }
      if (response != 1) {
    
        req.session.details = req.body
        const email = req.body.email
        let otp = otpGenerator.generate(6, {
          digits: true,
          alphabets: false,
          upperCase: false,
          specialChars: false,
        });

        req.session.signupOtp = otp
        const transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          auth: {
            user: "lurline.harvey51@ethereal.email",
            pass: "NCZt8ZmHaJrA6M6YdE",
          },
        });
        const mailOptions = {
          from: "lurline.harvey51@ethereal.email",
          to: email,
          subject: "OTP for sign up",
          text: `Your OTP is ${otp}`,
        };
        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.log(err);
            res.status(500).send({ message: "Error sending OTP email" });
            client.close();
            return;
          }
        });
        res.render("user/otp");
      }
    });
  },
  otpPost: (req, res) => {
    let otp = req.session.signupOtp
    let userOtp = req.body.otp
    let userDetails = req.session.details
    let date = new Date()
    userDetails.date = date
    console.log(userDetails)
    if(otp === userOtp){
      userHelpers.addUser(userDetails).then((response)=>{
        req.session.userOtp = null;
        req.session.signupSuccess = true
        res.redirect("/login");
      })
    } else {
       req.session.otpError = true;
        res.redirect("/signup");
      }
  },
  loginGet: (req, res) => {
    if (req.session.user) {
      res.redirect("/");
    } else {
      let signupSuccess = req.session.signupSuccess
      res.render("user/login", {
        loginError: req.session.loginError,
        blockError: req.session.blockError,
        guest: true,signupSuccess
      });
      req.session.loginError = false;
      req.session.blockError = false;
      req.session.signupSuccess = false;
    }
  },
  loginPost: (req, res) => {
    userHelpers.doLogin(req.body).then((response) => {
      if (response.status) {
        req.session.user = response.user;
        res.redirect("/");
      } else if (response === 1) {
        req.session.blockError = "You are blocked";
        res.redirect("/login");
      } else {
        req.session.loginError = "Invalid username or password";
        res.redirect("/login");
      }
    });
  },
  logoutGet: (req, res) => {
    req.session.destroy();
    res.redirect("/");
  },

  // ************ user Profile ******//

  userProfileGet: async (req, res) => {
    let userId = req.session.user._id;
    let user = await userHelpers.userDetails(userId);
    let userAddresses = await userHelpers.getUserAddress(userId);
    let success = req.session.pchange
    res.render("user/user-profile", { user, userAddresses, success });
    req.session.pchange = false
  },
  addAddressPost: (req, res) => {
    let userId = req.body.userId;
    let addressobj = {
      name: req.body.fullName,
      address: req.body.address,
      zipCode: req.body.zipCode,
      mobileNo: req.body.mobileNo,
    };
    userHelpers.addNewAddress(userId, addressobj).then(() => {
      res.redirect("/user-profile");
    });
  },
  statusChangeGet: async (req, res) => {
    let id = req.query.id;
    let status = req.query.st;
    let item = req.query.item;
    userHelpers.cancelOrder(id, status, item);

      let order = await userHelpers.getOrder(id)
      if(order.paymentMethod === "online" || order.paymentMethod === null){
        let amount = order.totalAmount
        let userId = req.session.user._id
        userHelpers.addAmountWallet(amount,userId)
      } 
    
    res.redirect("/user-orders");
  },
  returnOrder: async (req, res) => {
    let id = req.query.id;
    let status = req.query.st;
    let item = req.query.item;
    let userId = req.session.user._id;
    userHelpers.cancelOrder(id, status, item);

    let order = await userHelpers.getOrder(id) 
    let amount = order.totalAmount
    userHelpers.addAmountWallet(amount,userId)

    res.redirect("/user-orders");
  },
  changePasswordGet: (req, res) => {
    let user = req.session.user;
    let id = req.query.id;
    req.session.pswError = false
    res.render("user/password-change", { id, user });
   
  },
  changePasswordPost: (req, res) => {
 
    let id = req.body.Id;
    let newPassword = req.body.newPassword;
    let oldPassword = req.body.currentPassword;
    userHelpers
      .changePassword(id, newPassword, oldPassword)
      .then((response) => {
        req.session.pchange = true
        res.redirect("/user-profile");
      })
      .catch((err) => {
        let user = req.session.user;
        console.log(err);
       req.session.pswError = true
       let error = req.session.pswError
        res.render("user/password-change", { id, user, error });
        req.session.pswError = false
      });
  },
  editAddressPost: (req, res) => {
    let Id = req.query.id;
    let addressobj = {
      name: req.body.fullName,
      address: req.body.address,
      zipCode: req.body.zipCode,
      mobileNo: req.body.mobileNo,
    };
    userHelpers.editAddress(Id, addressobj);
    res.redirect("/user-profile");
  },

  deleteAddressGet: (req, res) => {
    let Id = req.query.id;
    userHelpers.deleteAddress(Id);
    res.redirect("/user-profile");
  },

  addProfileImage: (req, res) => {
    let picPath = req.file.filename;
    let id = req.body.id;

    userHelpers.addProImg(id, picPath).then((result) => {
      res.redirect("/user-profile");
    });
  },

  //  ********** cart ********** //

  cartGet: async (req, res) => {
    let userId = req.session.user._id;
    let user = await userHelpers.userDetails(userId);
    let products = await userHelpers.getCartProducts(user._id);
    if (products.length) {
      let total = await userHelpers.getTotalAmount(user._id);
      req.session.user.pAmount = total;
      user.pAmount = total
      req.session.usedCoupon = null
      res.render("user/cart", { products, user});
    } else {
      req.session.cartEmptyError = "Your Cart is Empty !";
      let emptyError = req.session.cartEmptyError;
      res.render("user/cart", { user, emptyError });
    }
  },

  applyCouponPost: async (req, res) => {
    let couponCode = req.body.coupon;
   
    const currDate = new Date();
    let endDate
    let userCoupon = await couponHelpers.applyCoupon(couponCode);
    if(userCoupon && !req.session.usedCoupon){

      endDate = new Date(userCoupon.expiryDate);
      
    if (endDate > currDate) {
     
      let  total = req.session.user.pAmount
      let response = {}

      req.session.usedCoupon = userCoupon.couponCode;
      response.response = true;
      let discountAmount = ((total * userCoupon.discount)/100)

      if(discountAmount < userCoupon.maxAmount){
        response.discountAmount = discountAmount
        response.newTotal =  (total- discountAmount)
        req.session.user.pAmount =  (total- discountAmount)
      } else {
        response.discountAmount = userCoupon.maxAmount
        response.newTotal = total - userCoupon.maxAmount
        req.session.user.pAmount = total - userCoupon.maxAmount
      }
    
      res.json(response);

    } else {
      res.json({ response: false });
    }
    } else {
      res.json({response:false})
    }
  },
  getCouponDetails: async (req,res) => {
    let couponCode = req.body.coupon
    console.log(req.body.coupon)
    let userCoupon = await couponHelpers.applyCoupon(couponCode);
   
    res.json(userCoupon)
  },
  useWalletPost:async(req,res)=>{
  
    let wallet = req.body.wallet;
    let Amount = req.session.user.pAmount
    let balance 
    let walletBalance 
    if(wallet > Amount){
      balance = 0;
      walletBalance = Math.abs(Amount-wallet);
    } else {
      balance = Math.abs(Amount-wallet);
      walletBalance = 0
    }
    req.session.user.actAmount = Amount;
    req.session.user.pAmount = balance;
    req.session.user.walletBalance = walletBalance
    req.session.walletApply=true;

    let response={}
    response.total = balance;
    response.walletBalance = walletBalance
    res.json(response)
   
  },
  
  addToCartGet: (req, res) => {
    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
      res.json({ status: true });
    });
  },

  chngPrdctQntyPost: async (req, res) => {
    
    let stock = await productHelpers.getStock(req.body)
 
    if(stock.Stock >= req.body.quantity){
      userHelpers.changeProductQuantity(req.body).then(async (response) => {
        response.total = await userHelpers.getTotalAmount(req.body.user);
        res.json(response);
      });
    } else {
      let response = {err:"out of sock"}
      res.json(response)
    }
   
  },

  removeProductCartPost: (req, res) => {
    userHelpers.removeFromCart(req.body).then((response) => {
      res.json("Product removed");
    });
  },

  // ****************** Adress **************** //

  useAddressGet: async (req, res) => {
    let addId = req.query.id;
    let user = req.session.user;
    let actAmount = req.session.user.actAmount;
    let userAddresses = await userHelpers.getUserAddress(user._id);
    let usingAddress = await userHelpers.getOneAddress(addId);
    res.render("user/address", { userAddresses, user, usingAddress, actAmount });
  },
  addNewAddressPost: (req, res) => {
    let userId = req.body.userId;
    let addressobj = {
      name: req.body.fullName,
      address: req.body.address,
      zipCode: req.body.zipCode,
      mobileNo: req.body.mobileNo,
    };
    userHelpers.addNewAddress(userId, addressobj).then(() => {
      res.redirect("/delivery-address");
    });
  },

  editAddressGet: async (req, res) => {
    let user = req.session.user;
    let addressId = req.query.id;
    let Address = await userHelpers.getOneAddress(addressId);

    res.render("user/edit-address", { Address, user });
  },

  deleteAddress: (req, res) => {
    let Id = req.query.id;
    userHelpers.deleteAddress(Id);
    res.redirect("/delivery-address");
  },

  // ************* Product Related routes ************ //

  productDetailsGet: async (req, res) => {
    let user = req.session.user;
    let product = await productHelpers.getProductDetails(req.params.id);


    res.render("user/product-details", { product, user, guest: true });
  },

  allProductsGet: async  (req, res) => {
    let user = req.session.user;
    let category = await categoryHelpers.getAllCategory()
    productHelpers.getAllProducts().then((products) => {
      res.render("user/all-products", { products,category, user, guest: true });
    });
  },

  // *************** Order Management  ************** //

  deliveryAddressGet: async (req, res) => {
    let user = req.session.user;
    let actAmount = req.session.user.actAmount;
    let userAddresses = await userHelpers.getUserAddress(req.session.user._id);
    res.render("user/address", { user, userAddresses, actAmount });
  },
  
  deliveryAddressPost: async (req, res) => {
   
    let total 
    let data = req.body
    let products = await userHelpers.getCartProductList(req.body.userId);
    let test = req.session.user.pAmount
    if(req.session.walletApply){
      total = req.session.user.actAmount
    } else {
      total = req.session.user.pAmount
    }
    req.session.body = data
    if(test == 0){
      let order = await userHelpers.placeOrder(data, products, total)
      req.session.orderId = order
      res.json({ codSuccess: true });
    }
    else if (req.body["payment-method"] === "COD") {
      let order = await userHelpers.placeOrder(data, products, total)
      req.session.orderId = order
      res.json({ codSuccess: true });
    } else {
      userHelpers.generateRazorpay(total).then((response) => {
        res.json(response);
      });
    }
  },


  verifyPayment: (req, res) => {
    userHelpers
      .verifyPayment(req.body)
      .then( async () => {
        let products = await userHelpers.getCartProductList(req.session.user._id);
        console.log(products)
        let  data = req.session.body 
        let total 
        let order
        if(req.session.walletApply){
          total = req.session.user.actAmount
          order = await userHelpers.placeOrder(data, products, total)
        } else {
          total = req.session.user.pAmount
          order = await userHelpers.placeOrder(data, products, total)
        }
        
        req.session.orderId = order
        res.json({ status: true });
        req.session.data = null
      })
      .catch((err) => {
        res.json({ status: false, errMsg: "" });
      });
  },

  orderSuccesfulGet: async (req, res) => {
    let user = req.session.user;
    let price = req.session.user.pAmount;
    let amount = req.session.user.walletBalance;
    let id = req.session.orderId

    if(req.session.walletApply){
      userHelpers.deductAmountWallet(amount,user._id)
      req.session.walletApply=false;
      req.session.walletBalance = 0;
    }

    if (req.session.usedCoupon) {
      let usedCoupon = req.session.usedCoupon;
      userHelpers.deleteCoupon(user._id, usedCoupon);
      req.session.usedCoupon = null;
      req.session.couponDiscount = false;
    }

    let coupon = await couponHelpers.giveCoupon(price); 
    if (coupon) {
      let userId = user._id;
      userHelpers.addCouponUser(userId, coupon);
    }
    req.session.user.pAmount = 0;
    req.session.user.actAmount = 0;

    let order = await userHelpers.getOrder(id);
    
    productHelpers.changeQuantity(order.products)
    req.session.orderId = null;

    res.render("user/order-successful", { user, coupon, order }); 

  },

  userOrder: async (req, res) => {
    let user = req.session.user;
    let orderDetails = await userHelpers.getUserOrders(user._id);
    res.render("user/user-orders", { orderDetails, user });
  },

  viewOrderDetailsGet: async (req, res) => {
    let user = req.session.user;

    let orderId = req.query.id;
  
    let order = await userHelpers.getOrder(orderId);
   
    res.render("user/order-details", { user, order });
  },

  dowloadInvoice :async (req, res) => {
    try {
      let id = req.query.k
      // Retrieve data from the database
      const customerData = await userHelpers.getOrderData(id); // Replace with your own database query function
     
      let invoiceItems = customerData.products
      console.log(invoiceItems)
      const invoiceData = {
        documentTitle: 'Invoice',

        client: {
          company: customerData.deliveryDetails.fullName,
          address: customerData.deliveryDetails.address,
          zip: customerData.deliveryDetails.zipCode,
          phone: customerData.deliveryDetails.mobileNo,
          
        },
  
        // Use invoice items from the database
        products: invoiceItems.map(item => ({
          quantity: item.quantity,
          description: item.category,
          tax: item.tax,
          price: item.price
        }))
      }
  
      // Generate the invoice PDF
      const pdfData = easyinvoice.createInvoice(invoiceData);
      const fileName = 'invoice.pdf';
  
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.send(Buffer.from(pdfData.pdf, 'base64'));
    } catch (error) {
      console.error('Error generating invoice:', error);
      res.status(500).send('An error occurred while generating the invoice');
    }
  },
  
};
