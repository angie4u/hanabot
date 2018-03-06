/* -----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework.
----------------------------------------------------------------------------- */

var restify = require('restify')
var builder = require('botbuilder')
var botbuilder_azure = require('botbuilder-azure')
// var peopleNumCard = require('./adaptiveCard/peopleNumberCard.js').card
var peopleNumCard = require('./adaptiveCard/peopleNumCard_v2.js').card2
var checkinCard = require('./adaptiveCard/checkinCard.js').card
var cityCard = require('./adaptiveCard/city.js').card

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
var isContextChange = false

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

var bot = new builder.UniversalBot(connector, [
  function (session) {
    session.send('안녕하세요 만나서 반갑습니다!')
    return session.beginDialog('askCityInfo')
    // session.beginDialog('askForPeopleNumber')
  },
  function (session, results, next) {
    builder.Prompts.text(session, `입력하신 도시는 ${results.response}입니다.`)
    next()
  },
  function (session, results) {
    session.beginDialog('askBeginDate')
  },
  function (session, results) {
    session.send(`체크인 및 체크아웃 일정은 ${results.response}과 같습니다.`)
    // builder.Prompts.text(session, `체크인 및 체크아웃 일정은 ${results.response}과 같습니다.`)
    builder.Prompts.choice(session, '예약 일정이 맞습니까? ', '예|아니오', { listStyle: builder.ListStyle.button })
  },
  function (session, results) {
    if (results.response.entity === '예') {
      session.beginDialog('askForPeopleNumber')
    } else {
      session.replaceDialog('askBeginDate', { reprompt: true })
    }
    // session.beginDialog('askForPeopleNumber')
    // session.send()
  },
  function (session, results) {
    // session.beginDialog('askForPeopleNumber')
    session.dialogData.peopleNumOption = results.response
    session.send(`호텔 예약 인원수는 ${session.dialogData.peopleNumOption}조건으로 찾아봐 드릴께요!`)
    builder.Prompts.choice(session, '추가로 방을 예약하시겠습니까? ', '예|아니오', { listStyle: builder.ListStyle.button })
  },
  function (session, results) {
    if (results.response.entity === '예') {
      session.replaceDialog('askForPeopleNumber', { reprompt: true })
    } else {
      // 방을 추가하지 않는 경우
      session.send('검색할 조건은 다음과 같습니다')
      session.send('검색 조건 나열')
      // 검색 조건 나열
      // 정렬 조건 나열
    }
  }
])
// log any bot errors into the console
bot.on('error', function (e) {
  console.log('And error ocurred', e)
})
bot.on('conversationUpdate', function (message) {
  if (message.membersAdded) {
    message.membersAdded.forEach(function (identity) {
      if (identity.id === message.address.bot.id) {
        bot.beginDialog(message.address, '/')
      }
    })
  }
})
bot.dialog('askCityInfo', [

  function (session) {
      // 기본 버튼  사용
      // builder.Prompts.choice(session, "Which color?", "red|green|blue", { listStyle: 3 });

    if (session.message && session.message.value) {
          // A Card's Submit Action obj was received
      session.endDialogWithResult({ response: session.message.value.cityCode })

          // session.send(session.message.value.cityCode)
      return
    }
      // addAttachment 사용
    var msg = new builder.Message(session)
          .addAttachment(cityCard)

      // 전송
    session.send(msg)
  }
])

bot.dialog('askForPeopleNumber', [
  function (session) {
    if (session.message && session.message.value) {
            // 사용자가 선택한 값 출력
      console.log(session.message.value)
      var peopleValue = JSON.stringify(session.message.value)
      session.endDialogWithResult({ response: peopleValue })
      return
    }

    var msg = new builder.Message(session)
        .addAttachment(peopleNumCard)
    session.send(msg)
  }
])

bot.dialog('support', [
  function (session) {
    session.send('고객센터 상담 업무는 02-XXX-XXX로 연락주시기 바랍니다. 감사합니다.')
    session.endDialog()
  }
])
.triggerAction({
  matches: [/도와줘/i, /상담사/i, /그만/i],
  onSelectAction: (session, args, next) => {
    // Add the help dialog to the dialog stack
    // (override the default behavior of replacing the stack)
    session.send('지금까지의 대화 정보가 임시 저장되고, 상담 관련 안내를 진행합니다')
    session.beginDialog(args.action, args)
  }
})

bot.dialog('askBeginDate', [
  function (session) {
    if (session.message && session.message.value) {
        // 사용자가 선택한 값 출력
      console.log(session.message.value)
      var checkinDate = session.message.value.checkinDate
      var checkoutDate = session.message.value.checkoutDate

      session.endDialogWithResult({ response: checkinDate })
      return
    }

    var msg = new builder.Message(session).addAttachment(checkinCard)
    session.send(msg)
  }
])

bot.set('storage', tableStorage)
