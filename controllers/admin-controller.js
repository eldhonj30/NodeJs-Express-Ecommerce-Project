const productHelpers = require("../helpers/product-helpers");
const adminHelpers = require("../helpers/admin-helpers");
const categoryHelpers = require("../helpers/category-helpers");
const couponHelpers = require("../helpers/coupon-helpers")
// const Swal = require("sweetalert2");
// const { response } = require("../app");
const PDFDocument = require("pdfkit");
const { response } = require("../app");


module.exports = {

  // ---------- Products ------------ //

  allProductsGet: (req, res) => {
    let admin = req.session.admin;
    let val = Number(req.query.p);

    productHelpers.getAllProductsPagination(val).then((products) => {
      console.log(products);
      categoryHelpers.getAllCategory().then((category) => {
        let prosuccess = req.session.proadded
        let prodelete =  req.session.prodeleted
        let proedit =  req.session.proedit
        res.render("admin/view-products", { products, admin, category, prosuccess, prodelete, proedit });
        req.session.proadded = false
        req.session.prodeleted = false
        req.session.proedit = false
      });
    });
  },
  allProductsPost: (req, res) => { 
    let admin = req.session.admin;
    let searchq = String(req.body.search);
    productHelpers
      .searchProducts(searchq)
      .then((products) => {
        res.render("admin/view-products", { products, admin });
      })
      .catch((err) => {
        console.log(err);
        res.render("admin/view-products", { err, admin });
      });
  },
  addProductsPost: async (req, res) => {
    req.body.picPath = req.file.filename
    req.body.Stock = Number(req.body.Stock)
    req.body.Date = new Date()
    productHelpers.addProduct(req.body).then((response)=>{
     if(response){
      req.session.proadded = true
      res.redirect("/admin/")
     }
    
    })
   
  },
  deleteProducts: (req, res) => {
    let proId = req.params.id;
    console.log(proId);
    productHelpers.deleteProduct(proId).then((response) => {
      req.session.prodeleted = true
      res.redirect("/admin/");
    });
  },
  editProductsGet: async (req, res) => {
    let product = await productHelpers.getProductDetails(req.params.id);
    let category = await  categoryHelpers.getAllCategory()
    console.log(product);
    res.render("admin/edit-product", { product,category, admin: true });
  },
  editProductsPost: async (req, res) => {
    let id = req.params.id;
    req.body.Stock = Number(req.body.Stock)
    let product = await productHelpers.getProductDetails(id);
    let object = {}
        if(req.file){
          object = {
            Name:req.body.Name,
            Description:req.body.Description,
            MRP:req.body.MRP,
            Stock:req.body.Stock,
            Category:req.body.Category,
            picPath:req.file.filename,
            Date:product.Date
          }
        } else {
          object = {
            Name:req.body.Name,
            Description:req.body.Description,
            MRP:req.body.MRP,
            Stock:req.body.Stock,
            Category:req.body.Category,
            picPath:product.picPath,
            Date:product.Date
          }
        }
    productHelpers.updateProduct(req.params.id, object).then(() => {
      req.session.proedit = true
      res.redirect("/admin");
    });
  },

  //---------------- admin login ------------- //

  loginGet: (req, res) => {
    if (req.session.admin) {
      res.redirect("/admin");
    } else {
      res.render("admin/login", { loginErr: req.session.adminLoginErr });
      req.session.adminLoginErr = false;
    }
  },

  loginPost: (req, res) => {
    adminHelpers.doLogin(req.body).then((response) => {
      if (response.status) {
        console.log("Admin successfully logged in");
        req.session.admin = response.admin;
        req.session.admin.loggedIn = true;
        res.redirect("/admin");
      } else {
        req.session.adminLoginErr = true;
        res.redirect("/admin/adminLogin");
      }
    });
  },

  logoutGet: (req, res) => {
    req.session.admin = null;
    res.redirect("/admin/adminLogin");
  },

  // ---------------- all users -------------- //

  allusersGet: async (req, res) => {
    let page = Number(req.query.p);
    let users = await adminHelpers.getAllUsers(page);
    res.render("admin/all-users", { admin: true, users });
  },

  allusersPost: async (req, res) => {
    let searchQ = String(req.body.search);
    try {
      let users = await adminHelpers.searchAllUsers(searchQ);

      res.render("admin/all-users", { admin: true, users });
    } catch (err) {
      res.render("admin/all-users", { admin: true, err });
    }
  },

  blockUserGet: async (req, res) => {
    let userId = req.params.id;
    adminHelpers.blockUser(userId).then(() => {
      res.redirect("/admin/all-users");
    });
  },

  unblockGet: async (req, res) => {
    let userId = req.params.id;
    adminHelpers.unBlockUser(userId).then(() => {
      res.redirect("/admin/all-users");
    });
  },

  sortedUsersGet: async (req, res) => {
    let value = String(req.query.v);
    let users = await adminHelpers.getSortedUsers(pData, value);
    res.render("admin/all-users", { admin: true, users });
  },

  // ------------------- all category ----------------- //

  viewCategoryGet: (req, res) => {
    categoryHelpers.getAllCategory().then((category) => {
      res.render("admin/view-categories", { category, admin: true });
    });
  },

  addCategoryGet: (req, res) => {
    res.render("admin/add-category", {
      catError: req.session.catError,
      admin: true,
    });
    req.session.catError = false;
  },

  addCategoryPost: (req, res) => {
    req.body.picPath = req.file.filename
    categoryHelpers.addCategory(req.body).then((data) => {
      if (data) {
        res.redirect("/admin/view-category");
      } else {
        req.session.catError = "Category Already Exist";
        res.redirect("/admin/add-category");
      }
    });
  },

  hideCategoryGet: (req, res) => {
    let cateId = req.params.id;
    console.log(cateId);
    categoryHelpers.hideCategory(cateId).then((response) => {
      res.redirect("/admin/view-category");
    });
  },

  unhideCategoryGet: (req, res) => {
    let cateId = req.params.id;
    console.log(cateId);
    categoryHelpers.unHideCategory(cateId).then((response) => {
      res.redirect("/admin/view-category");
    });
  },

  editCategoryGet: async (req, res) => {
    let category = await categoryHelpers.getCategoryDetails(req.params.id);
    console.log(category);
    res.render("admin/edit-category", {
      category,
      admin: true,
      catError: req.session.catError,
    });
    req.session.catError = false;
  },

  editCategoryPost: async (req, res) => {
    let insertedId = req.params.id
    if(req.file){
      let picPath = req.file.filename
      req.body.picPath = picPath
    } else {
   
      let category = await categoryHelpers.getCategoryDetails(req.params.id);
      req.body.picPath = category.picPath
    }
    categoryHelpers.updateCategory(req.params.id, req.body).then((response) => {
      if (response) {
        res.redirect("/admin/view-category");
      } else {
        req.session.catError = "Category Already Exist";
        res.redirect("/admin/edit-category/" + insertedId);
      }
    });
  },

  ordersGet: async (req, res) => {
    let admin = req.session.admin;
    let orderDetails = await adminHelpers.getAllOrders();
    console.log(orderDetails);
    res.render("admin/order-details", { orderDetails, admin });
  },

  statusChangeGet: (req, res) => {
    let id = req.query.id;
    let status = req.query.st;
    let item = req.query.item
    adminHelpers.cancelOrder(id, status,item);
    res.redirect("/admin/orders");
  },

  outOfStockGet: async (req, res) => {
    let id = req.params.id;

    adminHelpers.delivered(id);
    res.redirect("/admin/orders");
  },

  // ---------------- coupon management ------------- //

  viewCouponGet: (req, res) => {
    let admin = req.session.admin
    couponHelpers.getCoupons().then((response) => {
      res.render("admin/view-coupon", { response,admin });
    });
  },

  addCouponGet: (req, res) => {
    let admin = req.session.admin
    res.render("admin/add-coupon",{admin});
  },

  addCouponPost: (req, res) => {
  
    req.body.couponCode = req.body.couponCode.toUpperCase()
    req.body.discount = parseInt(req.body.discount)
    req.body.minPurchase = parseInt(req.body.minPurchase)
    req.body.maxAmount = parseInt(req.body.maxAmount)

    couponHelpers.addcoupon(req.body).then((response) => {
      res.json({ response });
    });
  },
  editCouponGet: (req,res)=>{
    let id = req.params.id;
    
    couponHelpers.getOneCoupon(id).then((coupon)=>{
     
      res.render('admin/edit-coupon',{coupon})
    })
  },
  editCouponPost:(req,res)=>{
    let couponCode = req.body.couponCode.toUpperCase()
    let discount = parseInt(req.body.discount)
    let minPurchase = parseInt(req.body.minPurchase)
    let maxAmount = parseInt(req.body.maxAmount)

    let id = req.body.id

    let data = {
      couponCode: couponCode,
      expiryDate: req.body.expiryDate,
      discount: discount,
      minPurchase: minPurchase,
      maxAmount:maxAmount
    }
    couponHelpers.editCoupon(id,data).then((response) => {
      res.json({ response });
    });
  },
  deleteCouponPost:(req,res)=>{
    let id = req.body.id
    console.log(req.body)
    couponHelpers.deleteCoupon(id).then((response)=>{
      res.json({response})
    })
  },

  // sales report start ///
salesReportPost: async (req, res) => {
  let totalPricesevenday = await adminHelpers.getAmountLastSevenDay();
  let totalPricemonth = await adminHelpers.getAmountLastMonth();
  let totalPriceyear = await adminHelpers.getAmountLastYear();

  let totalQuatitysevenday = await adminHelpers.getTotalProductQuantityLastSevenDays();
  let totalQuatitymonth = await adminHelpers.getTotalProductQuantityLastMonth();
  let totalQuatityyear = await adminHelpers.getTotalProductQuantityLastYear();

  let totalOrdersevenday = await adminHelpers.getOrderLastSevenDay();
  let totalOrdermonth = await adminHelpers.getOrderLastMonth();
  let totalOrderyear = await adminHelpers.getOrderLastYear();

  let totalUsersevenday = await adminHelpers.getUserInLastSevenDay();
  let totalUsermonth = await adminHelpers.getUserInLastMonth();
  let totalUseryear = await adminHelpers.getUserInLastYear();

  let totalAmounts = await adminHelpers.totalAmount();
  let totalAmount = totalAmounts.totalAmount;
  let totalOrder = totalAmounts.totalOrders;
  let totalCustomer = await adminHelpers.totalUser();

  const data = [
    {
      days: "A week",
      sales: totalPricesevenday,
      orders: totalOrdersevenday,
      products: totalQuatitysevenday,
      customers: totalUsersevenday,
    },
    {
      days: "A month",
      sales: totalPricemonth,
      orders: totalOrdermonth,
      products: totalQuatitymonth,
      customers:totalUsermonth,
    },
    {
      days: "A year",
      sales: totalPriceyear,
      orders: totalOrderyear,
      products: totalQuatityyear,
      customers: totalUseryear,
    },
  ];

  const doc = new PDFDocument();

  // Set the response headers for PDF download
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=sales_report.pdf");

  // Create the table header
  doc.font("Helvetica-Bold").fontSize(12);
  doc.text("Days", 50, 50);
  doc.text("Sales (rupees)", 150, 50);
  doc.text("Orders", 250, 50);
  doc.text("Products", 350, 50);
  doc.text("Customers", 450, 50);
  let y = 70;
  // Create the table rows
  doc.font("Helvetica").fontSize(20);
  doc.text("Fast-Fit Full Summary", 210, y + -55);
  doc.font("Helvetica").fontSize(10);

  data.forEach((row) => {
    doc.text(row.days, 50, y);
    doc.text(row.sales.toString(), 150, y);
    doc.text(row.orders.toString(), 250, y);
    doc.text(row.products.toString(), 350, y);
    doc.text(row.customers.toString(), 450, y);
    y += 20;
  });

  let date = new Date();
  doc.font("Helvetica-Bold").fontSize(12);
  doc.text("Total Income:", 250, y + 20);
  doc.text(totalAmount, 350, y + 20);
  doc.text("Total Orders:", 250, y + 40);
  doc.text(totalOrder, 350, y + 40);
  doc.text("Total Customers:", 250, y + 60);
  doc.text(totalCustomer, 350, y + 60);
  doc.text("Date:", 250, y + 80);
  doc.text(date, 350, y + 80);

  // Pipe the PDF document to the response
  doc.pipe(res);

  // End the document
  doc.end();
},
// sales report end//
 dashbordget: async (req, res) => {
  let latestorder = await adminHelpers.getAllLatestOrders();
  let latestuser = await adminHelpers.getAllLatestUsers();
  let totaluser = await adminHelpers.totalUser();
  let totalproduct = await adminHelpers.totalProduct();
  let totalAmount = await adminHelpers.totalAmount();
  let monthlydata = await adminHelpers.getSellingProductInEachMonth();
  let paymentCounts = await adminHelpers. paymentMethodCount()
  let sales = await adminHelpers.orderDelivered()
 
  res.render("admin/dash-board", {
    admin: true,
    latestorder,
    latestuser,
    totaluser,
    totalproduct,
    totalAmount,
    monthlydata,
    paymentCounts,
    sales
});
},
dashFilter: async (req,res) => {
  filter = req.body.data;
  parseInt(filter)
 
  if(filter == 7){
    let totalPricesevenday = await adminHelpers.getAmountLastSevenDay();
    let totalQuatitysevenday = await adminHelpers.getTotalProductQuantityLastSevenDays();
    let totalUsersevenday = await adminHelpers.getUserInLastSevenDay();
    let response = {}
    response.amount = totalPricesevenday
    response.product = totalQuatitysevenday
    response.user = totalUsersevenday
  
    res.json(response)
  } else if(filter == 30){
    let totalPricemonth = await adminHelpers.getAmountLastMonth();
    let totalQuatitymonth = await adminHelpers.getTotalProductQuantityLastMonth();
    let totalUsermonth = await adminHelpers.getUserInLastMonth();
    let response = {}
    response.amount = totalPricemonth
    response.product = totalQuatitymonth
    response.user = totalUsermonth
 
    res.json(response)
  } else {
    let totalUseryear = await adminHelpers.getUserInLastYear();
    let totalQuatityyear = await adminHelpers.getTotalProductQuantityLastYear();
    let totalPriceyear = await adminHelpers.getAmountLastYear();
    let response = {}
    response.amount = totalPriceyear
    response.product = totalQuatityyear
    response.user = totalUseryear
 
    res.json(response)
  }
},
salesReport:async(req,res) => {
  filter = req.query.range;
  let latestorder = await adminHelpers.getAllLatestOrders();
  let latestuser = await adminHelpers.getAllLatestUsers();
  let totaluser = await adminHelpers.totalUser();
  let totalproduct = await adminHelpers.totalProduct();
  let totalAmount = await adminHelpers.totalAmount();
  let monthlydata = await adminHelpers.getSellingProductInEachMonth();
  let paymentCounts = await adminHelpers. paymentMethodCount()
  let sales
  let range
  if(filter == "week"){
    sales = await adminHelpers.orderLastWeek()
    range = "Week"
  } else if(filter == "month"){
    sales = await adminHelpers.orderLastMonth()
    range = "Month"
  } else {
    sales = await adminHelpers.orderLastYear()
    range = "Year"
  }
  res.render("admin/dash-board", {
    admin: true,
    latestorder,
    latestuser,
    totaluser,
    totalproduct,
    totalAmount,
    monthlydata,
    paymentCounts,
    sales,
    range
});

},
dateFilter: async (req,res) => {
 let startDate = req.body.startDate
 let endDate = req.body.endDate
 startDate = new Date(startDate);
 endDate = new Date(endDate)

 let latestorder = await adminHelpers.getAllLatestOrders();
 let latestuser = await adminHelpers.getAllLatestUsers();
 let totaluser = await adminHelpers.totalUser();
 let totalproduct = await adminHelpers.totalProduct();
 let totalAmount = await adminHelpers.totalAmount();
 let monthlydata = await adminHelpers.getSellingProductInEachMonth();
 let paymentCounts = await adminHelpers. paymentMethodCount()
 let sales = await adminHelpers.orderInDate(startDate,endDate)

 res.render("admin/dash-board", {
  admin: true,
  latestorder,
  latestuser,
  totaluser,
  totalproduct,
  totalAmount,
  monthlydata,
  paymentCounts,
  sales
 });
}

};
