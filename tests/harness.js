var Test = (function(){
	//Set this variable to true if running tests in a PhoneGap environ. We'll expect different data //that way.
    var totalTests = 0;
    var totalPasses = 0;

    var harness = {
    	//Basic test function keeps track of failures and successes.
    	//Give it a boolean expression to test
    	//Give it a failure message to display
    	//Give it 
	    test:function (expression, message, domId, cleanup) {
	        totalTests++;
	        var node = null;
	        if(expression) {
	            totalPasses++;
	            node = document.createTextNode("PASS: "+message);
	        } else {
	            node = document.createTextNode("FAIL: "+message);
	        }
	        document.getElementById(domId).appendChild(node);
	        document.getElementById(domId).appendChild(document.createElement("br"));
	        cleanup();
	    },

	    passPercentage: function(){
	    	return totalPasses/totalTests;
	    },

	    isPhoneGap: function(){
	    	return typeof window.device === "undefined";
	    }
    }

    return harness;
}())