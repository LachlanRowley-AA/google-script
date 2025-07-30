function doGet(e) {
  try {
    const sheetID = ""
    const sheetName = ""
    const startTime = new Date().getTime();
    let apiKey;
    if(!e) {
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

    let data;
    
    console.log(`time to load: ${new Date().getTime() - startTime}`);
    const sheet = SpreadsheetApp.openById(sheetID).getSheetByName(sheetName);
    
    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1,1,1,lastCol).getValues().flat();
    console.log(headers);
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

    console.log(`time to look at headers: ${new Date().getTime() - startTime}`);

    // Check if required columns exist
    if (pwIndex === undefined) {
      console.log('not found');
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "UUID column not found"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    console.log(`pwIndex: ${pwIndex}`)
    const lastRow = sheet.getLastRow();
    const pwData = sheet.getRange(1,pwIndex + 1, lastRow, 1).getValues();

    console.log(`time to look begin search: ${new Date().getTime() - startTime}`);
    const foundRow = pwData.findIndex(row => row[0] === apiKey);
    console.log(`time to end search: ${new Date().getTime() - startTime}`);

    if (foundRow) {
      const data = sheet.getRange(foundRow, 1, 1, lastCol).getValues();
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
          executionTime: executionTime + "ms",
          timestamp: new Date().toISOString()
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const endTime = new Date().getTime();
    const executionTime = endTime - startTime;
    console.log(`User not found | Time: ${executionTime}ms`);

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
