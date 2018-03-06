/* -----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework.
----------------------------------------------------------------------------- */

var restify = require('restify')
var builder = require('botbuilder')
var botbuilder_azure = require('botbuilder-azure')
// var peopleNumCard = require('./adaptiveCard/peopleNumberCard.js').card
var peopleNumCard = require('./adaptiveCard/peopleNumCard_v2.js').card2
var checkinCard = require('./adaptiveCard/checkinCard.js').card
var city = require('./city.js').card

var cognitiveservices = require('./node_modules/botbuilder-cognitiveservices');

// Setup Restify Server
var server = restify.createServer()
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url)
})

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata
})

// Listen for messages from users
server.post('/api/messages', connector.listen())

/* ----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot.
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */
var connString = 'DefaultEndpointsProtocol=https;AccountName=hanatour9833;AccountKey=6jqh42QQjWWBwoPGGR/Jr0PZjhBMZVbHm/gkhEfHvOj8aV6+oI8ed6ZAAwB5m793WqyQDiduJJB0QpseJwqYxw==;EndpointSuffix=core.windows.net'
var tableName = 'botdata'
// var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage'])
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, connString)
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient)

// Create your bot with a function to receive messages from the user
// var bot = new builder.UniversalBot(connector)

var bot = new builder.UniversalBot(connector);
//bot.set('storage', new builder.MemoryBotStorage());         // Register in-memory state storage
//server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs &&  key
//=========================================================

var recognizer = new cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: '5aa5a440-5939-411d-8279-3eb92e2d7253',
    subscriptionKey: 'cc2c5764d57b4feaafa0480d0c355653',
    top: 4
});

var qnaMakerTools = new cognitiveservices.QnAMakerTools();
bot.library(qnaMakerTools.createLibrary());

var basicQnAMakerDialog = new cognitiveservices.QnAMakerDialog({
    recognizers: [recognizer],
    defaultMessage: 'No match! Try changing the query terms!',
    qnaThreshold: 0.3,
    feedbackLib: qnaMakerTools
});

// Override to also include the knowledgebase question with the answer on confident matches
basicQnAMakerDialog.respondFromQnAMakerResult = function (session, qnaMakerResult) {
    var result = qnaMakerResult;
    var response = 'Here is the match from FAQ:  \r\n  Q: ' + result.answers[0].questions[0] + '  \r\n A: ' + result.answers[0].answer;
    session.send(response);
}

// Override to log user query and matched Q&A before ending the dialog
basicQnAMakerDialog.defaultWaitNextMessage = function (session, qnaMakerResult) {
    if (session.privateConversationData.qnaFeedbackUserQuestion != null && qnaMakerResult.answers != null && qnaMakerResult.answers.length > 0
        && qnaMakerResult.answers[0].questions != null && qnaMakerResult.answers[0].questions.length > 0 && qnaMakerResult.answers[0].answer != null) {
        console.log('User Query: ' + session.privateConversationData.qnaFeedbackUserQuestion);
        console.log('KB Question: ' + qnaMakerResult.answers[0].questions[0]);
        console.log('KB Answer: ' + qnaMakerResult.answers[0].answer);
    }
    session.endDialog();
}
bot.dialog('/', basicQnAMakerDialog);

