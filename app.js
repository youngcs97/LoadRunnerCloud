'use strict';

//include CommonJS module+
const lr = require("./load-runner-cloud.js");

//load the configuration from JSON (be sure to edit for your settings)
lr.config = require("./config.json")

//set debug for more verbose messaging
lr.config.debug = true;

//use this to configure proxy support (or Fiddler/Postman debugging)
//lr.config.proxy = 'http://127.0.0.1:8866'



//This is for Step 1 - Parsing Swagger into a DevWeb script
function runNoPrompt() {
   
    //this reads a local Swagger file and makes a DevWeb script
    lr.swagger.toDevWeb("test/swagger-example.json", "test/swagger-example/");

    //you can also do the same from a URL instead
    //lr.swagger.toDevWeb("http://cyoung.us/swagger-example.json", "test/swagger-example/");
} 
runNoPrompt();  //uncomment to run step 1



//*/ This is for Step 2 - Prompt for password and execute API's to upload packages (uncomment the "inquirer.prompt" line)
var questions = [{ type: 'password', name: 'pwd', message: "Please enter your SRL password" }];
var inquirer = require('inquirer');

//Can use this to alternatively hardcode the password (do not use inquirer)
//lr.config.password="<password>"; runAfterAnswer()

//use inquirer instead (more secure)
inquirer.prompt(questions).then(answers => { lr.config.password = answers['pwd'].toString(); runAfterAnswer(); }); //*/
async function runAfterAnswer() {

    lr.PushToCloud("test/swagger-example","MyScript","MyTest", false, false)

    //Additional Examples
    //lr.PushToCloud("test/Selenium/out/artifacts/Selenium_jar", "MySeleniumScript", "MySeleniumTest", false, false) 
    //lr.PushToCloud("test/Gatling/simulations/com/microfocus/example", "MyGatlingScript", "MyGatlingTest", false, false)
    //lr.PushToCloud("test/CSVTest", "MyCSVScript", "MyCSVTest", false, true)

}
