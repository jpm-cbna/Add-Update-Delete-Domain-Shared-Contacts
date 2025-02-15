var SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
var DOMAIN = Session.getEffectiveUser().getEmail().split("@")[1];
var SHEET_NAME = SpreadsheetApp.getActiveSheet().getSheetName();
var ERROR_RECIPIENT_MAIL = Session.getEffectiveUser().getEmail();
var HIGHEST_BOUNDARY,LOWEST_BOUNDARY,ERROR_COUNT = '';


function onInstall(e) {
  onOpen(e);
}


function onOpen(e) {
  SpreadsheetApp.getUi()
    .createAddonMenu()
    .addItem('Récupérer les contacts', 'getAllContacts')
    .addItem('Appliquer les changements','syncContacts')
    .addToUi();
}


function syncContacts() {
  var maxRows =  SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).getLastRow();
  
  if (maxRows<=1) {
    Logger.log("AUCUNE DONNÉES À TRAITER.");
  } else {
    var i = 2;
    var range;
    range = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).getRange(i, 1, 1, 18).getValues();
    while (i <= maxRows && range[0][0] != null && range[0][0] != undefined && range[0][0] != '') {
      switch (range[0][16]) {
        case 'ADD':
          addContact(
            range[0][0], 
            range[0][1], 
            range[0][2], 
            range[0][3], 
            range[0][4], 
            range[0][5], 
            range[0][6], 
            range[0][7], 
            range[0][8], 
            range[0][9], 
            range[0][10], 
            range[0][11],
            range[0][12],
            range[0][13],
            range[0][14],
            i
          );
          break;
        case 'UPDATE':
          updateContact(
            range[0][0],
            range[0][1],
            range[0][2],
            range[0][3],
            range[0][4],
            range[0][5],
            range[0][6],
            range[0][7],
            range[0][8],
            range[0][9],
            range[0][10],
            range[0][11],
            range[0][12],
            range[0][13],
            range[0][14],
            range[0][15],
            i
          );
          break;
        case 'DELETE':
          deleteContact(range[0][15], i);
          break;
      }
      i++;
      range = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).getRange(i, 1, 1, 18).getValues();
    }
  }
  
  if (ERROR_COUNT == '') {
    Utilities.sleep(1000);
    //getAllContacts();
    var lastRow = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).getLastRow();
  
    if (lastRow >= 2) {
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).deleteRows(2, lastRow*1-1);
    }
    
    SpreadsheetApp.getActiveSpreadsheet().toast('Toutes les opérations ont été traitées avec succès.');
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast('Il y a eu des erreurs lors du traitement de la requête.');
  }
}


function addContact(firstName, lastName, fullName, primaryEmail, orgName, orgTitle, orgLabel, secondaryEmail, primaryPhone, secondaryPhone, city, street, region, postcode, country, rowNumber) {
  if (orgName =='' || orgName == undefined || orgName==null) orgName='--';
  if (orgTitle =='' || orgTitle == undefined || orgTitle==null) orgTitle='--';
  if (orgLabel =='' || orgLabel == undefined || orgLabel==null) orgLabel='';
  if (secondaryEmail =='' || secondaryEmail == undefined || secondaryEmail==null) secondaryEmail='--';
  if (primaryPhone =='' || primaryPhone == undefined || primaryPhone==null) primaryPhone='--';
  if (secondaryPhone =='' || secondaryPhone == secondaryPhone || secondaryPhone==null) secondaryPhone='--';
  if (city =='' || city == undefined || city==null) city='--';
  if (street =='' || street == undefined || street==null) street='--';
  if (region =='' || region == undefined || region==null) region='--';
  if (postcode =='' || postcode == undefined || postcode==null) postcode='--';
  if (country =='' || country == undefined || country==null) country='--';
  
  var buildXML = 
    "<atom:entry xmlns:atom='http://www.w3.org/2005/Atom' xmlns:gd='http://schemas.google.com/g/2005'>"+
      "<atom:category scheme='http://schemas.google.com/g/2005#kind' term='http://schemas.google.com/contact/2008#contact' />"+
      "<gd:name>"+
        "<gd:givenName>"+firstName+"</gd:givenName>"+
        "<gd:familyName>"+lastName+"</gd:familyName>"+
        "<gd:fullName>"+fullName+"</gd:fullName>"+
      "</gd:name>"+
      "<atom:content type='text'>Notes</atom:content>"+
      "<gd:email rel='http://schemas.google.com/g/2005#work'    primary='true'    address='"+primaryEmail+"' displayName='"+firstName+" "+lastName+"' />"+
      "<gd:email rel='http://schemas.google.com/g/2005#home'    address='"+secondaryEmail+"' />"+
      "<gd:phoneNumber rel='http://schemas.google.com/g/2005#work'    primary='true'>"+primaryPhone+"</gd:phoneNumber>"+
      "<gd:phoneNumber rel='http://schemas.google.com/g/2005#home'>"+secondaryPhone+"</gd:phoneNumber>"+
      "<gd:im address='"+primaryEmail+"'    protocol='http://schemas.google.com/g/2005#GOOGLE_TALK'    primary='true'    rel='http://schemas.google.com/g/2005#home' />"+
      "<gd:organization>"+
        "<gd:orgName>"+orgName+"</gd:orgName>"+
        "<gd:orgTitle>"+orgTitle+"</gd:orgTitle>"+
      "</gd:organization>"+
      "<gd:structuredPostalAddress rel='http://schemas.google.com/g/2005#work' primary='true'>"+
        "<gd:city>"+city+"</gd:city>"+
        "<gd:street>"+street+"</gd:street>"+
        "<gd:region>"+region+"</gd:region>"+
        "<gd:postcode>"+postcode+"</gd:postcode>"+
        "<gd:country>"+country+"</gd:country>"+
        "<gd:formattedAddress>"+street+" "+city+"</gd:formattedAddress>"+
      "</gd:structuredPostalAddress>"+
    "</atom:entry>";
  
  var params = {
    method: "post",
    contentType: "application/atom+xml",
    headers: {"Authorization": "Bearer " + ScriptApp.getOAuthToken(), "GData-Version": "3.0"},
    payload: buildXML,
    muteHttpExceptions: true
  };
  
  var resp = UrlFetchApp.fetch("https://www.google.com/m8/feeds/contacts/"+DOMAIN+"/full", params);
  Logger.log("https://www.google.com/m8/feeds/contacts/"+DOMAIN+"/full");
  var respCode = resp.getResponseCode();
  Logger.log("Response code:"+respCode);
  SpreadsheetApp.getActiveSpreadsheet().toast("Response code:"+respCode);

  if (respCode=='201' || respCode=='200') {
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).getRange(rowNumber*1, 18, 1, 1).setValue('OK');
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).getRange(rowNumber*1, 17, 1, 1).clear();
  } else {
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).getRange(rowNumber*1, 18, 1, 1).setValue('ERREUR');
    ERROR_COUNT = ERROR_COUNT.toString() + rowNumber;
  }
}


function getAllContacts(){
  var contacts = ContactsApp.getContacts();
  var lastRow = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).getLastRow();
  
  if (lastRow >= 2) {
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).deleteRows(2, lastRow * 1 - 2);
  }
  
  var contacts = ContactsApp.getContacts();
  var params = {
    method: "get",
    contentType: "application/atom+xml",
    headers: {"Authorization": "Bearer " + ScriptApp.getOAuthToken(),"GData-Version": "3.0"},
    muteHttpExceptions: true
  };
  
  var startIndex = 1;
  var data, respCode, resp;
  resp = UrlFetchApp.fetch(
    "https://www.google.com/m8/feeds/contacts/"+DOMAIN+"/full?alt=json&start-index="+startIndex, 
    params
  );
  
  respCode = resp.getResponseCode();
  
  data = JSON.parse(resp.getContentText());
  
  while (data.feed.entry) {
    var contact={};
    var contactArray=[];
    
    for (var i in data.feed.entry) {
      if (data.feed.entry[i].gd$name) {
        if (data.feed.entry[i].gd$name.gd$givenName) {contact.firstName = data.feed.entry[i].gd$name.gd$givenName.$t;} else {contact.firstName=' ';}
        if (data.feed.entry[i].gd$name.gd$familyName) {contact.lastName = data.feed.entry[i].gd$name.gd$familyName.$t;} else {contact.lastName=' ';}
        if (data.feed.entry[i].gd$name.gd$fullName) {contact.fullName = data.feed.entry[i].gd$name.gd$fullName.$t;} else {contact.fullName= ' ';}
      }
      
      if (data.feed.entry[i].gd$email) {
        if (data.feed.entry[i].gd$email[0]) {contact.primaryEmail = data.feed.entry[i].gd$email[0].address;} else {contact.primaryEmail=' ';}
        if (data.feed.entry[i].gd$email[1]) {contact.secondaryEmail = data.feed.entry[i].gd$email[1].address;} else {contact.secondaryEmail=' ';}
      }
      
      if (data.feed.entry[i].gd$phoneNumber) {
        if (data.feed.entry[i].gd$phoneNumber[0]) {contact.primaryPhone = data.feed.entry[i].gd$phoneNumber[0].$t;} else {contact.primaryPhone=' ';}
        if (data.feed.entry[i].gd$phoneNumber[1]) {contact.secondaryPhone = data.feed.entry[i].gd$phoneNumber[1].$t;} else {contact.secondaryPhone=' ';}
      }

      if (data.feed.entry[i].gd$organization) {
        if (data.feed.entry[i].gd$organization[0].gd$orgName) {contact.orgName = data.feed.entry[i].gd$organization[0].gd$orgName.$t;} else {contact.orgName=' ';}
        if (data.feed.entry[i].gd$organization[0].gd$orgTitle) {contact.orgTitle = data.feed.entry[i].gd$organization[0].gd$orgTitle.$t;} else {contact.orgTitle=' ';}
        // Tentative gestion des labels d'organisation
        //if (data.feed.entry[i].gd$organization.label) {contact.orgLabel = data.feed.entry[i].gd$organization.label;} else {contact.orgLabel=' ';}
        contact.orgLabel = ' ';
      }
      
      if (data.feed.entry[i].gd$structuredPostalAddress) {
        if (data.feed.entry[i].gd$structuredPostalAddress[0].gd$city) {contact.city = data.feed.entry[i].gd$structuredPostalAddress[0].gd$city.$t;} else {contact.city=' ';}
        if (data.feed.entry[i].gd$structuredPostalAddress[0].gd$street) {contact.street = data.feed.entry[i].gd$structuredPostalAddress[0].gd$street.$t;} else {contact.street=' ';}
        if (data.feed.entry[i].gd$structuredPostalAddress[0].gd$region) {contact.region = data.feed.entry[i].gd$structuredPostalAddress[0].gd$region.$t;} else {contact.region=' ';}
        if (data.feed.entry[i].gd$structuredPostalAddress[0].gd$postcode) {contact.postCode = data.feed.entry[i].gd$structuredPostalAddress[0].gd$postcode.$t;} else {contact.postCode=' ';}
        if (data.feed.entry[i].gd$structuredPostalAddress[0].gd$country) {contact.country = data.feed.entry[i].gd$structuredPostalAddress[0].gd$country.$t;} else {contact.country=' ';}
      }
      
      for (var q in data.feed.entry[i].link) {
        if (data.feed.entry[i].link[q].rel=='edit') {
          contact.id = data.feed.entry[i].link[q].href;
        }
      }
      
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).appendRow([
        contact.firstName,
        contact.lastName,
        contact.fullName,
        contact.primaryEmail,
        contact.orgName,
        contact.orgTitle,
        contact.orgLabel,
        contact.secondaryEmail,
        '="'+contact.primaryPhone+'"',
        '="'+contact.secondaryPhone+'"',
        contact.city,
        contact.street,
        contact.region,
        contact.postCode,
        contact.country,
        contact.id
        ]);    
    }
    startIndex = startIndex * 1 + 25;
    resp = UrlFetchApp.fetch("https://www.google.com/m8/feeds/contacts/"+DOMAIN+"/full?alt=json&start-index="+startIndex, params);
    respCode = resp.getResponseCode();
  
    data = JSON.parse(resp.getContentText());
  }
}


function updateContact(firstName, lastName, fullName, primaryEmail, orgName, orgTitle, orgLabel, secondaryEmail, primaryPhone, secondaryPhone, city, street, region, postcode, country, contactID, rowNumber) {
  if (orgName =='' || orgName == undefined || orgName==null) orgName='--';
  if (orgTitle =='' || orgTitle == undefined || orgTitle==null) orgTitle='--';
  if (orgLabel =='' || orgLabel == undefined || orgLabel==null) orgLabel='';
  if (secondaryEmail =='' || secondaryEmail == undefined || secondaryEmail==null) secondaryEmail='--';
  if (primaryPhone =='' || primaryPhone == undefined || primaryPhone==null) primaryPhone='--';
  if (secondaryPhone =='' || secondaryPhone == secondaryPhone || secondaryPhone==null) secondaryPhone='--';
  if (city =='' || city == undefined || city==null) city='--';
  if (street =='' || street == undefined || street==null) street='--';
  if (region =='' || region == undefined || region==null) region='--';
  if (postcode =='' || postcode == undefined || postcode==null) postcode='--';
  if (country =='' || country == undefined || country==null) country='--';
  
  var buildXML = 
    "<atom:entry xmlns:atom='http://www.w3.org/2005/Atom' xmlns:gd='http://schemas.google.com/g/2005'>"+
      "<atom:category scheme='http://schemas.google.com/g/2005#kind'    term='http://schemas.google.com/contact/2008#contact' />"+
      "<id>"+contactID+"</id>"+
      "<gd:name>"+
        "<gd:givenName>"+firstName+"</gd:givenName>"+
        "<gd:familyName>"+lastName+"</gd:familyName>"+
        "<gd:fullName>"+fullName+"</gd:fullName>"+
      "</gd:name>"+
	    "<atom:content type='text'>Notes</atom:content>"+
	    "<gd:email rel='http://schemas.google.com/g/2005#work'    primary='true'    address='"+primaryEmail+"' displayName='"+firstName+" "+lastName+"' />"+
      "<gd:email rel='http://schemas.google.com/g/2005#home'    address='"+secondaryEmail+"' />"+
	    "<gd:phoneNumber rel='http://schemas.google.com/g/2005#work'    primary='true'>"+primaryPhone+"</gd:phoneNumber>"+
	    "<gd:phoneNumber rel='http://schemas.google.com/g/2005#home'>"+secondaryPhone+"</gd:phoneNumber>"+
	    "<gd:im address='"+primaryEmail+"'    protocol='http://schemas.google.com/g/2005#GOOGLE_TALK'    primary='true'    rel='http://schemas.google.com/g/2005#home' />"+
      "<gd:organization>"+
        "<gd:orgName>"+orgName+"</gd:orgName>"+
        "<gd:orgTitle>"+orgTitle+"</gd:orgTitle>"+
      "</gd:organization>"+
      "<gd:structuredPostalAddress      rel='http://schemas.google.com/g/2005#work'      primary='true'>"+
        "<gd:city>"+city+"</gd:city>"+
        "<gd:street>"+street+"</gd:street>"+
        "<gd:region>"+region+"</gd:region>"+
        "<gd:postcode>"+postcode+"</gd:postcode>"+
        "<gd:country>"+country+"</gd:country>"+
        "<gd:formattedAddress>"+street+" "+city+"</gd:formattedAddress>"+
      "</gd:structuredPostalAddress>"+
    "</atom:entry>";
  
  var params = {
    method: "put",
    contentType: "application/atom+xml",
    headers: {"Authorization": "Bearer " + ScriptApp.getOAuthToken(), "GData-Version": "3.0", "If-Match": "*"},
    payload: buildXML,
    muteHttpExceptions: true
  };
  
  var resp = UrlFetchApp.fetch(contactID,params);
  var respCode = resp.getResponseCode();
  
  if (respCode=='201' || respCode=='200') {
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).getRange(rowNumber * 1, 18, 1, 1).setValue('OK');
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).getRange(rowNumber * 1, 17, 1, 1).clear();
  } else {
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).getRange(rowNumber * 1, 18, 1, 1).setValue('ERREURR');
    ERROR_COUNT = ERROR_COUNT.toString()+rowNumber;
  }
}


function deleteContact(contactID, rowNumber) {
  var params = {
    method      : "delete",
    contentType : "application/json",
    headers     : {"Authorization": "Bearer " + ScriptApp.getOAuthToken(),"GData-Version": "3.0","If-Match":"*"}
  };
  
  var resp = UrlFetchApp.fetch(contactID, params);
  
  var respCode=resp.getResponseCode();
  
  if (respCode=='201' || respCode=='200') {
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).deleteRow(rowNumber*1);
  } else {
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).getRange(rowNumber*1, 18, 1, 1).setValue('ERREUR');
    ERROR_COUNT=ERROR_COUNT.toString()+rowNumber;
  }
}
