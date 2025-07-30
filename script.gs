function doGet(e) {
  try {
    const sheetID = "";
    const sheetName = "";
    const startTime = new Date().getTime();

    let apiKey = (!e || !e.parameter.accountKey) ? 'test' : e.parameter.accountKey;

    if (!apiKey) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Missing accountKey"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = SpreadsheetApp.openById(sheetID).getSheetByName(sheetName);

    const headers = sheet.getRange("1:1").getValues()[0];
    const headerMap = {};
    for (let i = 0; i < headers.length; i++) {
      headerMap[headers[i]] = i;
    }

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

    if (pwIndex === undefined) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "UUID column not found"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const cache = CacheService.getScriptCache();
    let uuidList = cache.get("uuid_col");

    if (uuidList) {
      uuidList = JSON.parse(uuidList);
      console.log("UUID cache HIT");
    } else {
      const lastRow = sheet.getLastRow();
      const uuidRange = sheet.getRange(1, pwIndex + 1, lastRow, 1);
      uuidList = uuidRange.getValues().flat();
      cache.put("uuid_col", JSON.stringify(uuidList), 3600); // 5 minutes
      console.log("UUID cache MISS");
    }

    console.log(`time to look begin search: ${new Date().getTime() - startTime}`);
    const foundRow = uuidList.findIndex(val => val === apiKey);
    console.log(`time to end search: ${new Date().getTime() - startTime}`);

    if (foundRow !== -1) {
      const numColumns = headers.length;
      const data = sheet.getRange(foundRow + 1, 1, 1, numColumns).getValues()[0]; // +1 since rows are 1-based
      const endTime = new Date().getTime();
      const executionTime = endTime - startTime;
      console.log(data);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: {
          company: data[companyIndex] || "",
          email: data[emailIndex] || "",
          balance: data[balanceIndex] || "",
          phoneNumber: data[phoneIndex] || "",
          name: (data[firstNameIndex] + " " + data[lastNameIndex]).trim() || data[contactIndex],
          street: data[streetIndex] || "",
          city: data[cityIndex] || "",
          state: data[stateIndex] || "",
          postCode: data[postIndex] || "",
          country: data[countryIndex] || ""
        },
        _debug: {
          executionTime: executionTime + "ms",
          timestamp: new Date().toISOString()
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const endTime = new Date().getTime();
    const executionTime = endTime - startTime;
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "User not found",
      _debug: {
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
