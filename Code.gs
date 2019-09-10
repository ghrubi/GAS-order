// Order Guide Aggregation Script. Just add a spreadsheet order guide (in the correct layout)
// to the list with it's key. 

// -----------------------------------------------------
// Globals, contants
// -----------------------------------------------------
// Get the script properties.
var scriptProperties = PropertiesService.getScriptProperties();

function doGet() {
//  var scriptProperties = PropertiesService.getScriptProperties();
  var html = HtmlService.createTemplateFromFile('index');
  
  // Setup Global Variables. Google lost them once! Never again!
  scriptProperties.setProperty('orderSheet', '0');
  scriptProperties.setProperty('productSheet', '1');
  scriptProperties.setProperty('firstOrderDate', '5');
  scriptProperties.setProperty('dateSeparation', '3');
  scriptProperties.setProperty('numOrdersConfig', '3'); // How many existing order to show in dropdown
  scriptProperties.setProperty('dateRow', '0');
  scriptProperties.setProperty('newOrderLocation', 'e1');
  scriptProperties.setProperty('gridWidth', '7');
  scriptProperties.setProperty('orderDataRange', '3:201');
  scriptProperties.setProperty('productDataRange', 'a2:e200');
  // Set default rounding for order calcs
  scriptProperties.setProperty('roundUpOrder', 'false');
//  scriptProperties.setProperty('roundUpOrder', 'true');
  
//  // Reset Global single-instance Variables
  scriptProperties.setProperty('dateLocations', '');
  scriptProperties.setProperty('currDateNewOrder', '');
  scriptProperties.setProperty('selectedDate', '');

  //** SET DEBUGGING **//
  scriptProperties.setProperty('debugging', true);
  
  // Build hash table of order guide keys. Set it as a global var by setting
  // a script property.
//  var keys = new Array();
  var keys = {
//    'US Foods':'1UfFIL8vfmKaGzz_RUZUoXyoS0vpFNL3tmXyjiVDSVIA',
    'US Foods-Short':'1chP4H6AkqfRJxUAXucoiRARkVqWQcjdXP4cl_nI5HCE',
    'US Foods':'1Z_x1z_k6DztuhoLw2I8G9J_F7wVn1uEqxrotzHMukyc',
    'APP':'19ZsZGm3gOGoTmy5y3mkq1HI2B_ACAjTa57k2eHwhYrU'
//    'Oakland Packaging':'1uPQ1F5dO5-guuM-IhbLpk4E-vzksY5-kLxFkY3OsnSc'
  };

  Logger.log(keys['US Foods']);
  var str = JSON.stringify(keys);
  var arr = JSON.parse(str);
  Logger.log(arr['US Foods']);

  // Set Global Variable to order guide keys 
  scriptProperties.setProperty('keys', JSON.stringify(keys));
//  scriptProperties.setProperty('keys', hashToString(keys));

  return html.evaluate();
}

function getGuides(){
  // Get global var containing guide names. Convert string to hash
   var keys = JSON.parse(scriptProperties.getProperty('keys'));
  
  var arrKeys = new Array();
  
  for (var k in keys){
    Logger.log(k);
    arrKeys.push(k);
  }
  
  Logger.log("New: " + JSON.stringify(arrKeys));
//  return JSON.stringify(arrKeys);
//  return "gene";
  return arrKeys;  
//  return scriptProperties.getProperty('keys');
  
}
function selectGuide(form){
  // Get selection from list box
  var selectedGuide = form.guide_list;
  
  // Get global var containing guide names, keys, etc
  var s = scriptProperties.getProperty('keys');
  var orderSheet = parseInt(scriptProperties.getProperty('orderSheet'));
  var productSheet = parseInt(scriptProperties.getProperty('productSheet'));
  var firstOrderDate = parseInt(scriptProperties.getProperty('firstOrderDate'));
  var dateSeparation = parseInt(scriptProperties.getProperty('dateSeparation'));
  var numOrdersConfig = parseInt(scriptProperties.getProperty('numOrdersConfig'));
  var dateRow = parseInt(scriptProperties.getProperty('dateRow'));
  
//  var keys = backToHash(s);
  var keys = JSON.parse(s)
  
  // Set global var containing selected guide key
  scriptProperties.setProperty('currGuide', keys[selectedGuide]);
  
  // Open spreadsheet
  var doc = SpreadsheetApp.openById(keys[selectedGuide]);
  var sheet = doc.getSheets()[orderSheet];
 
  // array to become hash of dates and ss columns. to be saved as a global var.
  var dateHash = {};
  
  // Setup constants for date search
  var colNames = new Array("a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","aa","ab","ac","ad","ae","af","ag","ah","ai","aj");
 
  // Figure out row '1's' range of order dates. begin at firstOrderDate offset
  // and multiply by number of orders to grab -- configurable.
  var dtRangeStart = colNames[firstOrderDate-1] + '1';
  var dtRangeEnd = colNames[((dateSeparation * (numOrdersConfig-1)) + firstOrderDate)-1] + '1';
  var dtRange = dtRangeStart + ':' + dtRangeEnd;
  var dateDataRange = sheet.getRange(dtRange);
  var numCols = dateDataRange.getNumColumns();
  var l = dateDataRange.getValues();
  var dt;
        
  // Get current date and compare to most recent order date.
  // If current date is earlier, set that as the new earliest order date.
  var currDate = new Date();
  var currDateYr = Utilities.formatDate(currDate, "PST", "yyyy");
  var currDateM = Utilities.formatDate(currDate, "PST", "MM");
  var currDateD = Utilities.formatDate(currDate, "PST", "dd");
  
  // subtract '1' from month to make it right?!?
  currDate = new Date(currDateYr, currDateM-1, currDateD);
  
  Logger.log('currDate: ' + currDate);
  
  // Create return Obj.
  var retObj = new Array();
  
  // [0] will be selectedGuide. The rest will be dates.
  retObj.push(selectedGuide);
  
  for(var i=0; i<numCols; i+=dateSeparation){
     // If current date is newer than the first order date, add to list.
    if(i == 0){  
      if(l[dateRow][i] < currDate){
        dt = Utilities.formatDate(currDate, "PST", "MM-dd-yyyy");
        retObj.push(dt);
        
        // Set flag stating that first date in date list will be a new order if selected.
        scriptProperties.setProperty('currDateNewOrder', 'n');
      }
      else{
        // Set flag stating that first date in date list will be an existing order if selected.
        scriptProperties.setProperty('currDateNewOrder', 'e');
      }
    }
    // Only use dates that exist in ss.
    if(l[dateRow][i] != ''){
      dt = Utilities.formatDate(l[dateRow][i], "PST", "MM-dd-yyyy");
      retObj.push(dt);
    
      // add to hash
      dateHash[dt] = colNames[(firstOrderDate + i)-1];
    }
   
  }
  // convert dateHash to string and set global var 
  var s = JSON.stringify(dateHash);
  scriptProperties.setProperty('dateLocations', s);

  Logger.log('Dates for list: ' + JSON.stringify(retObj));
  
  return retObj;
}

function selectDate(form){
  // Open ss and see if date selected makes it a new order. Need to tell the front-end that it is or isn't.
  
  // Get global var containing selected guide key, etc.
  var g = scriptProperties.getProperty('currGuide');
  var orderSheet = scriptProperties.getProperty('orderSheet');
  var productSheet = scriptProperties.getProperty('productSheet');
  var firstOrderDate = scriptProperties.getProperty('firstOrderDate');
  var dateSeparation = scriptProperties.getProperty('dateSeparation');
  var productDataRange = scriptProperties.getProperty('productDataRange');
  var gridWidth = parseInt(scriptProperties.getProperty('gridWidth'));
//  var panelNum = scriptProperties.getProperty('panelNum'); // keep track of which order guide panel
//  var newOrder = scriptProperties.getProperty('newOrder'); // is there a possibility of a new order?
  var newOrderLocation = scriptProperties.getProperty('newOrderLocation'); // new order location in ss?

  Logger.log("form.date_list: " + form.date_list);
  
  // Get selected date and set it to global variable
  var selectedDate = form.date_list;
  scriptProperties.setProperty('selectedDate', selectedDate);
  
//  scriptProperties.setProperty('debug', '***' + selectedDate);
  
  // get location of selected date. 
  var ssDateLocation = getLocation(selectedDate);

  Logger.log("ssDtLoc: " + ssDateLocation);
  
  // If ssDateLocation is undefinded, it's a new order 
//scriptProperties.setProperty('debug', ssDateLocation + ' before if');
  if(!ssDateLocation){  
    // Set global variable stating new order and location of first cell of new current order.  
    scriptProperties.setProperty('currOrderLocation', newOrderLocation);
    
    return doNewOrder(selectedDate);   
  }
  else{
    // Set global variable stating current existing order and location of first cell of existing order.
    // Must append '1'.
    var l = ssDateLocation + '1';
    scriptProperties.setProperty('currOrderLocation', l);
    return doExistingOrder(selectedDate);
  }

}

function newToExisting() {
  var selectedDate = scriptProperties.getProperty('selectedDate');
  
  return doExistingOrder(selectedDate);
}

//
// Helper functions.
//

function doNewOrder(selectedDate){
    
  // Get global var containing selected guide key, etc.
  var g = scriptProperties.getProperty('currGuide');
  var orderSheet = scriptProperties.getProperty('orderSheet');
  var productSheet = scriptProperties.getProperty('productSheet');
  var firstOrderDate = scriptProperties.getProperty('firstOrderDate');
  var dateSeparation = scriptProperties.getProperty('dateSeparation');
  var productDataRange = scriptProperties.getProperty('productDataRange');
  var gridWidth = parseInt(scriptProperties.getProperty('gridWidth'));
  var newOrderLocation = scriptProperties.getProperty('newOrderLocation'); // new order location in ss

//  // Create panel4 for order grid.
//  var panel4 = app.createVerticalPanel().setId('panel4');
  
  // Open spreadsheet
  var doc = SpreadsheetApp.openById(g);
  var sheetProduct = doc.getSheets()[productSheet];
  var sheetOrder = doc.getSheets()[orderSheet];
  
  // Setup for access to cells
  var productData = sheetProduct.getRange(productDataRange);
  var products = productData.getValues();
  
  var doneWithBlanks = false;
  while(!doneWithBlanks){
    if(products[products.length-1][1] == ''){
      products.pop(); 
    }
    else{
      doneWithBlanks = true;
    }   
  }
 
  // Set number of products global var.
  scriptProperties.setProperty('numProducts', products.length);
  
  // Create retObj
  var retObj = products;
  
  // Prepend 'n' for new order to retObj
  retObj.unshift('n');
  
  // Prepend selected date to retObj
  retObj.unshift(selectedDate);
  
//  // insert new order columns. set headers
//  sheetOrder.insertColumns(firstOrderDate, 3);
  
  Logger.log(JSON.stringify(retObj));
  
  return retObj;
}

function doExistingOrder(selectedDate){
    
  // Get global var containing selected guide key, etc.
  var g = scriptProperties.getProperty('currGuide');
  var orderSheet = scriptProperties.getProperty('orderSheet');
  var productSheet = scriptProperties.getProperty('productSheet');
  var firstOrderDate = scriptProperties.getProperty('firstOrderDate');
  var dateSeparation = scriptProperties.getProperty('dateSeparation');
  var productDataRange = scriptProperties.getProperty('productDataRange');
  var gridWidth = parseInt(scriptProperties.getProperty('gridWidth'));
  var newOrderLocation = scriptProperties.getProperty('newOrderLocation'); // new order location in ss

  // Set global var for selectedDate
  
  
//  // Create panel4 for order grid.
//  var panel4 = app.createVerticalPanel().setId('panel4');
  
  // Open spreadsheet
  var doc = SpreadsheetApp.openById(g);
  var sheetProduct = doc.getSheets()[productSheet];
  var sheetOrder = doc.getSheets()[orderSheet];
  
  // Setup for access to cells
  var productData = sheetProduct.getRange(productDataRange);
  var products = productData.getValues();
  // Get existing order data from ss
  var orderDataRange = scriptProperties.getProperty('currOrderLocation');
  orderDataRange = returnOrderRange(orderDataRange);
  var orderData = sheetOrder.getRange(orderDataRange);
  var order = orderData.getValues();
  
  var doneWithBlanks = false;
  while(!doneWithBlanks){
    if(products[products.length-1][1] == ''){
      products.pop(); 
    }
    else{
      doneWithBlanks = true;
    }   
  }
 
  // Set number of products global var.
  scriptProperties.setProperty('numProducts', products.length);
  
  // Append counts and order quantity to products
  for(var i=0; i<products.length; i++){
    products[i].push(order[i][0]);
    products[i].push(order[i][1]);
    products[i].push(order[i][2]);
  }
  
  // Create retObj
  var retObj = products;
  
  // Prepend 'e' for new order to retObj
  retObj.unshift('e');
  
  // Prepend selected date to retObj
  retObj.unshift(selectedDate);
  
//  // insert new order columns. set headers
//  sheetOrder.insertColumns(firstOrderDate, 3);
  
  Logger.log(JSON.stringify(retObj));
  
  return retObj;
}

function calcOrder(form){
  // Get global var containing selected guide key, etc.
  var g = scriptProperties.getProperty('currGuide');
  var orderSheet = scriptProperties.getProperty('orderSheet');
  var productSheet = scriptProperties.getProperty('productSheet');
  var firstOrderDate = scriptProperties.getProperty('firstOrderDate');
  var dateSeparation = scriptProperties.getProperty('dateSeparation');
  var productDataRange = scriptProperties.getProperty('productDataRange');
  var gridWidth = parseInt(scriptProperties.getProperty('gridWidth'));
  var newOrderLocation = scriptProperties.getProperty('newOrderLocation'); // new order location in ss   
  var selectedDate = scriptProperties.getProperty('selectedDate');
  var numProducts = scriptProperties.getProperty('numProducts');
  
  // Open spreadsheet
  var doc = SpreadsheetApp.openById(g);
  var sheetProduct = doc.getSheets()[productSheet];
  var sheetOrder = doc.getSheets()[orderSheet];
  
  // Setup for access to cells
  var productData = sheetProduct.getRange(productDataRange);
  var products = productData.getValues();
  
  // insert new order columns. set headers
  sheetOrder.insertColumns(firstOrderDate, 3);
  
  // Write headers for new order columns
  var cell = doc.getRange(newOrderLocation);
  cell.setValue(selectedDate); // Set the value of the first cell to order date
  cell.offset(1, 0).setValue('On Hand Case'); // Set the value of the cell below to 
  cell.offset(1, 1).setValue('On Hand Unit'); // set the value of the cell adjacent to
  cell.offset(1, 2).setValue('Order'); // set the value of the cell adjacent to    
  
  // Set up access to where order will be saved
  var orderData = scriptProperties.getProperty('currOrderLocation');
  var orderData = sheetOrder.getRange(orderData);
    
  // Compute order amounts
  var currCase = "";
  var currUnit = "";
  var currOrder = "";
  var totalCases = "";
  var buildup = "";
  var perCase = "";
  var minLevel = "";
  var calcOrder = "";
  
  var r = 0; // Grid has header and is + 2
  for(var i=0; i<numProducts; i++){
    r = i+2;
    currCase = 'c' + i;
    currUnit = 'u' + i;
    currOrder = 'o' + i;
      
    totalCases = 0;
    calcOrder = 0; // Reset
      
    buildup = Number(products[i][3]);
    perCase = Number(products[i][2]);
    minLevel = products[i][4];
      
    var c = "";
    var u = "";
//      if(e.parameter[currCase]){
      c = Number(form[currCase]);
//      }
//      if(e.parameter[currUnit]){
      u = Number(form[currUnit]);
//      }
      
    totalCases = ((c * perCase) + u) / perCase;
//    var minLevelCalc = Number(minLevel) / perCase;
    var minLevelCalc = Number(minLevel);
      
    // If no min, just use delta of totalCases and buildup. Otherwise, calculate against minLevel
    if(minLevel == '0'){
      if(totalCases == '0'){
        calcOrder = buildup;
      }
    }
    else if(minLevel == null || minLevel == ""){
      calcOrder = buildup - totalCases;
      if(scriptProperties.getProperty('roundUpOrder') == 'true'){
        calcOrder = Math.ceil(calcOrder);
      }
      else{
        calcOrder = Math.floor(calcOrder);
      }
    }

    else{
      if(totalCases<=minLevelCalc){
        calcOrder = buildup - totalCases;
        var closeMin = buildup - minLevelCalc; // for test in elseif. 
        if(calcOrder < 1){ // round up special case #1. ex. buildup = 2, min = 1.5 where total cases is 1.5.
          calcOrder = Math.ceil(calcOrder);
        }
        else if(closeMin < 1){ // round up special case #2. ex. buildup = 2, min = 1.5 where total cases is .5.
          calcOrder = Math.ceil(calcOrder);
        }
        else{ // everything else
          if(scriptProperties.getProperty('roundUpOrder') == 'true'){
            calcOrder = Math.ceil(calcOrder);
          }
          else{
            calcOrder = Math.floor(calcOrder);
          }
        }
      }
    }
    Logger.log("i: " + i + ", c: " + c + ", u: " + u + ", calc: " + calcOrder);
    
    orderData.offset(r, 0).setValue(c); // set the value of the cell to cases on hand
    orderData.offset(r, 1).setValue(u); // set the value of the cell to units on hand
    orderData.offset(r, 2).setValue(calcOrder); // set the value of the cell adjacent order
    
  } 
  
  return(selectedDate);
}

function updateOrder(form){
  // Get global var containing selected guide key, etc.
  var g = scriptProperties.getProperty('currGuide');
  var orderSheet = scriptProperties.getProperty('orderSheet');
  var productSheet = scriptProperties.getProperty('productSheet');
  var productDataRange = scriptProperties.getProperty('productDataRange');
  var gridWidth = parseInt(scriptProperties.getProperty('gridWidth'));
  var gridHeight = parseInt(scriptProperties.getProperty('gridHeight'));
  
  // Get current order location in ss
  var orderDataRange = scriptProperties.getProperty('currOrderLocation');
  
  // Open spreadsheet
  var doc = SpreadsheetApp.openById(g);
  var sheetOrder = doc.getSheets()[orderSheet];
    
  // Set up access to where order will be saved
  var orderData = scriptProperties.getProperty('currOrderLocation');
  var orderData = sheetOrder.getRange(orderData);

  // Setup vars for grid locations
  var currCase = "";
  var currUnit = "";
  var currOrder = "";

  var r = 0; // SS Grid has header and is + 1
  
  // Get number of products
  var numProducts = scriptProperties.getProperty('numProducts');
 
  for(var i=0; i<numProducts; i++){
    r = i+2;
    currCase = 'c' + i;
    currUnit = 'u' + i;
    currOrder = 'o' + i;    
    
    orderData.offset(r, 0).setValue(form[currCase]); // set the value of the cell to cases on hand
    orderData.offset(r, 1).setValue(form[currUnit]); // set the value of the cell to units on hand
    orderData.offset(r, 2).setValue(form[currOrder]); // set the value of the cell adjacent order
  }

  return(200);
}

function orderSummary(){
  // Remove items that have order quantity == 0
  
  // Get number of products
  var numProducts = scriptProperties.getProperty('numProducts');
  var selectedDate = scriptProperties.getProperty('selectedDate');
  
  // Get order items. Kick off first 2. Code reuse....
  var orderData = doExistingOrder(selectedDate);
  orderData.shift();
  orderData.shift();
  
  var retObj = Array();
//  var r = 0;
  
  // Order quantity location
  var currOrder = "";
  
  // [][7] is order quantity
  for(var i=0; i<numProducts; i++){
//    currOrder = 'o' + i;
    Logger.log(orderData[i]);
    if(orderData[i][7] > 0){
      retObj.push(orderData[i]);
//      r++;
    }
  }
  
  return retObj;
}

function getLocation(dt){
  // find location of passed date in select guide. 
  // undefined returned if date isn't found.
  
  // Get global var containing date location in ss.
  var dateHash = scriptProperties.getProperty('dateLocations');
  dateHash = JSON.parse(dateHash);
  
  return dateHash[dt];
  
}

function returnOrderRange(c){
  //var app = UiApp.getActiveApplication();
  // Get global for how order ranges are setup
  var pRange = scriptProperties.getProperty('orderDataRange');
  
  // Split : to get beginning and ending of range
  var a = pRange.split(":");
 
  // Setup constants for date search
  var colNames = new Array("a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","aa","ab","ac","ad","ae","af","ag","ah","ai","aj");

  // Strip number for individual cell. just need starting letter of starting cell
  c = c.replace(/[0-9]/g, '');
  
  // find index position
  var i = colNames.indexOf(c)
  
  // Order range spans 3 columns
  var e = colNames[i+2];
  
  // Build range
  return c + a[0] + ':' + e + a[1];
}
