function doGet(e) {
  try {
    const sheetID = ""
    const sheetName = ""
    const startTime = new Date().getTime();
    let apiKey;
    if(!e) { //Test API Key
      apiKey = 'test';
    }
    else {
      apiKey = e.parameter.accountKey;
    }    if (!apiKey) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Missing accountKey"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // // Try cache first
    const cache = CacheService.getScriptCache();
    const cacheKey = 'customer_data_v1';
    let cachedData = cache.get(cacheKey);
    
    let data;
    let cacheStatus;
    
    if (cachedData) {
      // Cache HIT
      console.log("CACHE HIT - Using cached data");
      cacheStatus = "HIT";
      try {
        data = JSON.parse(cachedData);
      } catch (e) {
        console.log("Cache corrupted, clearing and fetching fresh");
        cache.remove(cacheKey);
        cachedData = null;
        cacheStatus = "CORRUPTED";
      }
    }
    
    if (!cachedData) {
      // Cache MISS - read from sheet
      console.log("CACHE MISS - Reading from sheet");
      cacheStatus = cacheStatus === "CORRUPTED" ? "CORRUPTED" : "MISS";
    console.log(`time to load: ${new Date().getTime() - startTime}`);
    const sheet = SpreadsheetApp.openById(sheetID).getSheetByName(sheetName);
    data = sheet.getDataRange().getValues();
      
    //   // Store in cache for 50 minutes
      try {
        cache.put(cacheKey, JSON.stringify(data), 3000);
        console.log("Data cached for 50 minutes");
      } catch (e) {
        console.log("Cache storage failed:", e.toString());
      }
    }

    const headers = data[0];
    const rows = data.slice(1);
    console.log(`time to look at sheet: ${new Date().getTime() - startTime}`);
    const headerMap = {};
    for (let i = 0; i < headers.length; i++) {
      headerMap[headers[i]] = i;
    }

    // Get indices using the map
    const pwIndex = headerMap["UUID"];
    const companyIndex = headerMap["CompanyName"];
    const emailIndex = headerMap["Email"];
    const balanceIndex = headerMap["Current Balance"];
    const phoneIndex = headerMap["Phone1"];
    const firstNameIndex = headerMap["FirstName"];
    const lastNameIndex = headerMap["LastName"];
    const contactIndex = headerMap["ContactName"];
    const streetIndex = headerMap["Street"];
    const cityIndex = headerMap["City"];
    const stateIndex = headerMap["State"];
    const postIndex = headerMap["PostCode"];
    const countryIndex = headerMap["Country"];

    // Check if required columns exist
    if (pwIndex === undefined) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "UUID column not found"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const foundRow = rows.find(row => row[pwIndex] === apiKey);
    
    if (foundRow) {
      const endTime = new Date().getTime();
      const executionTime = endTime - startTime;
      
      console.log(`User found | Time: ${executionTime}ms`);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: {
          company: foundRow[companyIndex] || "",
          email: foundRow[emailIndex] || "",
          balance: foundRow[balanceIndex] || "",
          phoneNumber: foundRow[phoneIndex] || "",
          name: (foundRow[firstNameIndex] + " " + foundRow[lastNameIndex]).trim() || foundRow[contactIndex],
          street: foundRow[streetIndex] || "",
          city: foundRow[cityIndex] || "",
          state: foundRow[stateIndex] || "",
          postCode: foundRow[postIndex] || "",
          country: foundRow[countryIndex] || ""
        },
        _debug: {
          cacheStatus: cacheStatus,
          executionTime: executionTime + "ms",
          timestamp: new Date().toISOString()
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const endTime = new Date().getTime();
    const executionTime = endTime - startTime;
    console.log(`User not found | Cache: ${cacheStatus} | Time: ${executionTime}ms`);

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "User not found",
      _debug: {
        cacheStatus: cacheStatus,
        executionTime: executionTime + "ms"
      }
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.log("ERROR:", error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Server error: " + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
