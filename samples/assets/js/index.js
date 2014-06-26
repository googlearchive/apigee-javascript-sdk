/* APIGEE JavaScript SDK ENTITY EXAMPLE APP

This sample app will show you how to perform basic entity operation using the Apigee JavaScript SDK, including:
	
	- creating an entity
	- retrieving an entity
	- updating/altering an entity
	- deleting an entity
	
This file contains the functions that make the actual API requests. To run the app, open index.html in your browser. */

/* Before we make any requests, we prompt the user for their Apigee organization name, then initialize the SDK by
   instantiating the Apigee.Client class. 
   
   Note that this app is designed to use the unsecured 'sandbox' application that was included when you created your organization. */
   
var dataClient;
var entityUuid; //saves the UUID of the entity we create so we can perform retrieve, update and delete operations on it 
var user; //The owner of our assets
var asset; //The newly-created asset

function promptClientCredsAndInitializeSDK(){
	var APIGEE_ORGNAME;
	var APIGEE_APPNAME='sandbox';
	if("undefined"===typeof APIGEE_ORGNAME){
	    APIGEE_ORGNAME=prompt("What is the Organization Name you registered at http://apigee.com/usergrid?");
	}
	initializeSDK(APIGEE_ORGNAME,APIGEE_APPNAME);
}            


function initializeSDK(ORGNAME,APPNAME){	
	dataClient = new Apigee.Client({
	    orgName:ORGNAME,
	    appName:APPNAME,
		logging: false, //optional - turn on logging, off by default
		buildCurl: false //optional - log network calls in the console, off by default
	}, function(err, data){
		if(!err){

		}
	});	
}

/* 1. Create a new user

	To start, let's create a new user to serve as the owner of our asset. */
function createUser(){
	//create a user named Wilbur who will "own" our assets
	var username="user_"+Math.round(Math.random()*100000);
	dataClient.signup(username, "Sup3rS3cr3t!", "usergrid+"+username+"@apigee.com", "Wilbur", function (error, entity, data) {
        if (error) {
           document.getElementById('result-text').innerHTML
            =  "Error! Unable to create your user. "
            +   "Did you enter the correct organization name?"
            +   "<br/><br/>"
            +   "Error message:" 
            +	"<pre>" + JSON.stringify(data) + "</pre>";
            apigeeClient.logError({tag:"addUser", logMessage:message})
        } else {
            document.getElementById('result-text').innerHTML
            =  "Success!"
            +	"<br /><br />"
            +	"Here is the UUID (universally unique identifier of the"
            +	"user you created. We've saved it to reference the user "
            + 	"when we create the asset:"
            +	"<br /><br />"
            +   entity.get('uuid')
            +	"<br /><br />"
            + 	"And here is the full API response. The user is stored in the data property:"
            +   "<br/><br/>"
            +   "<pre>" + JSON.stringify(data, undefined, 4) + "</pre>";
            user=entity;
        }
    });
}

/* 2. Create a new entity

	To start, let's create a function to create an entity and save it on Apigee. */
	   
function createAsset () {
	/* First, we specify the properties for your new entity:
    
    - The type property associates your entity with a collection. When the entity, 
      is created, if the corresponding collection doesn't exist a new collection 
      will automatically be created to hold any entities of the same type. In this
      case, we'll be creating an entity of type 'asset'
      
      Collection names are the pluralized version of the entity type,
      e.g. all entities of type book will be saved in the books collection. 
    
    - Let's also specify some properties for your entity. Properties are formatted 
      as key-value pairs. We've started you off with the required properties: type,
      name, path, and owner.  You can add more properties as needed.  */
    var imageName='image_'+Math.round(Math.random()*100000)+'.jpg';
	var properties = {
        type:'asset',
        name:imageName,
        path: '/uploads/'+imageName,
        owner:user.get("uuid")
    };
    
    /* Next, we create our asset. Notice that we are passing the dataClient to the asset. */
    asset=new Usergrid.Asset({client:dataClient, data:properties}, function(errorStatus, asset){
        if (errorStatus) { 
           // Error - there was a problem creating the asset
           document.getElementById('result-text').innerHTML
            =  "Error! Unable to create your asset. "
            +   "Did you enter the correct organization name?"
            +   "<br/><br/>"
            +   "Error message:" 
            +	"<pre>" + JSON.stringify(asset) + "</pre>";
        } else { 
            // Success - the entity was created properly
            document.getElementById('result-text').innerHTML
            =  "Success!"
            +	"<br /><br />"
            +	"Here is the UUID (universally unique identifier of the "
            +	"asset you created. We've saved it to reference the asset "
            + 	"when we perform retrieve update and delete operations on it:"
            +	"<br /><br />"
            +   JSON.stringify(asset.get('uuid'))
            +	"<br /><br />"
            + 	"And here is the full API response. The asset is stored in the _data property:"
            +   "<br/><br/>"
            +   "<pre>" + JSON.stringify(asset, undefined, 4) + "</pre>";

           entityUuid = asset.get("uuid"); //saving the UUID so it's available for our other operations in this app
        }
    });
}




/* 3. Upload asset data

   We can add binary data to our asset using the upload method */
   	         
function updateAsset() {
   /*
		   - Specify your Apigee.Client object in the 'client' property. In this case, 'dataClient'.
		   - Specify the following in the 'data' property:
		   		- The 'type' and 'uuid' of the entity to be updated so that the API knows what 
		   		  entity you are trying to update.
		   		- New properties to add to the enitity. In this case, we'll add a property 
		   		  to show whether the book is available.
		   		- New values for existing properties. In this case, we are updating the 'price' property. */
	document.getElementById('result-text').innerHTML = "Uploading asset data...";
	var files = document.getElementById('upload').files;
	if(files.length===0){
          document.getElementById('result-text').innerHTML
            =  "Error! You need to select a file. "
            +   "You can use the apigee.ico file in the same directory as this sample."
            +   "<br/><br/>"
	}else{
		/* we have a file, let's upload it.*/
		asset.upload(files[0], function(errorStatus, entity){
			if (errorStatus) { 
			  // Error - there was a problem uploading the data
	          document.getElementById('result-text').innerHTML
	            =  "Error! Unable to retrieve your asset. "
	            +   "Check that the 'uuid' of the asset you tried to retrieve is correct."
	            +   "<br/><br/>"
	            +   "Error message:" 
	            + 	"<pre>" + JSON.stringify(entity, undefined, 4); + "</pre>"		                  
			} else { 
			  // Success - the entity was found and retrieved by the Apigee API
			  document.getElementById('result-text').innerHTML
	            =  "Success! Here is the asset data we retrieved: "
	            +   "<br/><br/>"
	            +   "<pre>" + JSON.stringify(entity, undefined, 4); + "</pre>"
			} 
		})
	}

}



/* 4. Retrieve the asset

   Now that we have uploaded data, let's download and display it: */
   
function retrieveAsset () {
	document.getElementById('result-text').innerHTML = "Downloading asset data...";
	/* The data is returned as a Javascript Blob */
	asset.download(function(errorStatus, file){
			if (errorStatus) { 
			  // Error - there was a problem retrieving the data
	          document.getElementById('result-text').innerHTML
	            =  "Error! Unable to retrieve your asset data. "
	            +   "<br/><br/>"
	            +   "Error message:" 
	            + 	"<pre>" + JSON.stringify(file, undefined, 4); + "</pre>"		                  
			} else { 
			  // Success - the entity was found and retrieved by the Apigee API
				document.getElementById('result-text').innerHTML
					=  "Success! Here is the asset data we retrieved: "
					+   "<br/><br/>";
				/* Create an image tag to hold our downloaded image data */
				var img = document.createElement("img");
			    /* Create a FileReader to feed the image into our newly-created element */
			    var reader = new FileReader();
			    reader.onload = (function(aImg) { return function(e) { aImg.src = e.target.result; }; })(img);
			    reader.readAsDataURL(file);
			    /* append the img element to our results page */
			    document.getElementById('result-text').appendChild(img);
   			} 

	})
}



/* 5. Delete an asset

   Now that we've created, retrieved and updated our asset, let's delete it. This will 
   permanently remove the asset and its contents from your data store. */
			
function deleteAsset () {

	/* We call the destroy() method to intitiate the API DELETE request */
	asset.destroy(function (error,response) {
	    if (error) { 
			  // Error - there was a problem deleting the entity
              document.getElementById('result-text').innerHTML
                =  "Error! Unable to delete your entity. "
                +   "Check that the 'uuid' of the entity you tried to delete is correct."
                +   "<br/><br/>"
                +   "Error message:" + JSON.stringify(error);		                 
			} else { 
			  // Success - the entity was successfully deleted
			  document.getElementById('result-text').innerHTML
                =  "Success! The entity has been deleted."
		}
	});	     
}

/* 6. Delete the user

   Now let's use the same method to selete our temporary user */
			
function deleteUser () {

	/* We call the destroy() method to intitiate the API DELETE request */
	user.destroy(function (error,response) {
	    if (error) { 
			  // Error - there was a problem deleting the entity
              document.getElementById('result-text').innerHTML
                =  "Error! Unable to delete your user. "
                +   "Check that the 'uuid' of the user you tried to delete is correct."
                +   "<br/><br/>"
                +   "Error message:" + JSON.stringify(error);		                 
			} else { 
			  // Success - the entity was successfully deleted
			  document.getElementById('result-text').innerHTML
                =  "Success! The user has been deleted."
		}
	});	     
}
