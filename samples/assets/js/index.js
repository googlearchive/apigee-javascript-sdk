/* Usergrid JavaScript SDK ENTITY EXAMPLE APP

This sample app will show you how to perform basic entity operation using the Usergrid JavaScript SDK, including:
	
	- creating an entity
	- retrieving an entity
	- updating/altering an entity
	- deleting an entity
	
This file contains the functions that make the actual API requests. To run the app, open index.html in your browser. */

/* Before we make any requests, we prompt the user for their Usergrid organization name, then initialize the SDK by
   instantiating the Usergrid.Client class. 
   
   Note that this app is designed to use the unsecured 'sandbox' application that was included when you created your organization. */
   
var dataClient;
var entityUuid; //saves the UUID of the entity we create so we can perform retrieve, update and delete operations on it 
var user; //The owner of our assets

function promptClientCredsAndInitializeSDK(){
	var Usergrid_ORGNAME;
	var Usergrid_APPNAME='sandbox';
	if("undefined"===typeof Usergrid_ORGNAME){
	    Usergrid_ORGNAME=prompt("What is the Organization Name you registered at http://Usergrid.com/usergrid?");
	}
	initializeSDK(Usergrid_ORGNAME,Usergrid_APPNAME);
}            


function initializeSDK(ORGNAME,APPNAME){	
	dataClient = new Usergrid.Client({
	    orgName:ORGNAME,
	    appName:APPNAME,
		logging: false, //optional - turn on logging, off by default
		buildCurl: false //optional - log network calls in the console, off by default
	}, function(err, data){
		if(!err){

		}
	});
	console.log(dataClient);	
}

/* 1. Create a new entity

	To start, let's create a user entity to attach an asset to and save it on Usergrid. */
	   
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
        type:'users',
        username:'assetUser', 
    };
    
    /* Next, we create our asset. Notice that we are passing the dataClient to the asset. */
    dataClient.createEntity(properties, function(err, response, entity) {
    	if (!err) {
    		user = entity;
    		console.log(entity);
    	} else {

    	}
    });    
}




/* 2. Upload asset data

   We can add binary data to our asset using the upload method */
   	         
function updateAsset() {
   /*
		   - Specify your Usergrid.Client object in the 'client' property. In this case, 'dataClient'.
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
            +   "You can use the Usergrid.ico file in the same directory as this sample."
            +   "<br/><br/>"
	}else{
		/* we have a file, let's upload it.*/
		user.attachAsset(files[0], function(errorStatus, entity){
			if (errorStatus) { 
			  // Error - there was a problem uploading the data
	          document.getElementById('result-text').innerHTML
	            =  "Error! Unable to retrieve your asset. "
	            +   "Check that the 'uuid' of the asset you tried to retrieve is correct."
	            +   "<br/><br/>"
	            +   "Error message:" 
	            + 	"<pre>" + JSON.stringify(entity, undefined, 4); + "</pre>"		                  
			} else { 
			  // Success - the entity was found and retrieved by the Usergrid API
			  document.getElementById('result-text').innerHTML
	            =  "Success! Here is the asset data we retrieved: "
	            +   "<br/><br/>"
	            +   "<pre>" + JSON.stringify(entity, undefined, 4); + "</pre>"
			} 
		})
	}

}



/* 3. Retrieve the asset

   Now that we have uploaded data, let's download and display it: */
   
function retrieveAsset () {


	document.getElementById('result-text').innerHTML = "Downloading asset data...";
	/* The data is returned as a Javascript Blob */
	user.downloadAsset(function(errorStatus, file){
			if (errorStatus) { 
			  // Error - there was a problem retrieving the data
	          document.getElementById('result-text').innerHTML
	            =  "Error! Unable to retrieve your asset data. "
	            +   "<br/><br/>"
	            +   "Error message:" 
	            + 	"<pre>" + JSON.stringify(file, undefined, 4); + "</pre>"		                  
			} else { 
			  // Success - the entity was found and retrieved by the Usergrid API
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