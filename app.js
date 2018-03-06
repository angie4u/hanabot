
var restify = require('restify')
var builder = require('botbuilder')
var botbuilder_azure = require('botbuilder-azure')
var peopleNumCard = require('./adaptiveCard/peopleNumCard_v2.js').card
var checkinCard = require('./adaptiveCard/checkinCard.js').card
var cityCard = require('./adaptiveCard/city2.js').card

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

var tableName = 'botdata'
const connString = 'DefaultEndpointsProtocol=https;AccountName=hanatour9833;AccountKey=6jqh42QQjWWBwoPGGR/Jr0PZjhBMZVbHm/gkhEfHvOj8aV6+oI8ed6ZAAwB5m793WqyQDiduJJB0QpseJwqYxw==;EndpointSuffix=core.windows.net'
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, connString)
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient)

var bot = new builder.UniversalBot(connector, [
  function (session) {
    session.send('안녕하세요 만나서 반갑습니다!')
    session.beginDialog('askCityInfo')
  },
  function (session, results) {
    console.log('console 도시 선택=' + `${results.response}`)

    session.conversationData.CITYCODE = results.response
    // session.send('session 정보= ' + session.conversationData.CITYCODE)

    session.beginDialog('askBeginDate')
  },
  function (session, results) {
    // 일자인 저장
    session.conversationData.CHECKIN = results.response
    // 체크아웃 일자 저장
    session.conversationData.CHECKOUT = results.response2

    // 출력
    // session.send('session 정보= ' + JSON.stringify(session.conversationData))

    session.send(`체크인:${session.conversationData.CHECKIN} / 체크아웃: ${session.conversationData.CHECKOUT}`)
    // builder.Prompts.text(session, `체크인 및 체크아웃 일정은 ${results.response}과 같습니다.`)
    builder.Prompts.choice(session, '예약 일정이 맞습니까? ', '예|아니오', { listStyle: builder.ListStyle.button })

    // session.send(JSON.stringify(hotelObj));
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
  function (session) {
    // var result = results.response
    if (session.conversationData.CHILD1_OPTION === undefined) {
      session.conversationData.CHILD1_OPTION = '선택안함'
    } if (session.conversationData.CHILD2_OPTION === undefined) {
      session.conversationData.CHILD2_OPTION = '선택안함'
    }
    session.send(`${session.conversationData.ADULT_OPTION}, 아이1:${session.conversationData.CHILD1_OPTION}, 아이2:${session.conversationData.CHILD2_OPTION}`)

    // 호텔 인원수 성인  저장
    //  var adult = session.conversationData.peopleNumOption;

    // session.conversationData.ROOM = result

    builder.Prompts.choice(session, '추가로 방을 예약하시겠습니까? ', '예|아니오', { listStyle: builder.ListStyle.button })
  },
  function (session, results, next) {
    if (results.response.entity === '예') {
      // session.beginDialog('askForPeopleNumber')
      session.replaceDialog('askForPeopleNumber', { reprompt: true })
    }

    let countryCondition = '출발도시:' + session.conversationData.CITYCODE + '\n'
    let dateCondition = '체크인:' + session.conversationData.CHECKIN + '체크아웃:' + session.conversationData.CHECKOUT + '\n'
    let peopleCondition = session.conversationData.ADULT_OPTION + '아이1:' + session.conversationData.CHILD1_OPTION + '아이2:' + session.conversationData.CHILD2_OPTION
    let searchCondition = countryCondition.concat(dateCondition, peopleCondition)

    session.send(searchCondition)
    session.save()
    session.conversationData = {}
  }
]).set('storage', tableStorage) // Register in-memory storage

bot.on('conversationUpdate', function (message) {
  if (message.membersAdded) {
    message.membersAdded.forEach(function (identity) {
      if (identity.id === message.address.bot.id) {
        bot.beginDialog(message.address, '/')
      }
    })
  }
})

// // Do not persist userData
// bot.set(`persistUserData`, false)

// // Do not persist conversationData
// bot.set(`persistConversationData`, false)

// log any bot errors into the console
bot.on('error', function (e) {
  console.log('And error ocurred', e)
})

bot.dialog('askCityInfo', [

  function (session) {
    var msg = new builder.Message(session).addAttachment(cityCard)
    session.send(msg)
    builder.Prompts.text(session, '원하는 내용을 선택하시기 바랍니다!')
  }, function (session, results) {
    console.log(results)
    session.endDialogWithResult({response: results.response})
  }
])

bot.dialog('askForPeopleNumber', [
  function (session) {
    if (session.message && session.message.value) {
      // 사용자가 선택한 값 출력
      console.log(session.message.value)
      session.conversationData.ADULT_OPTION = session.message.value.adult_option
      session.conversationData.CHILD1_OPTION = session.message.value.child1_option
      session.conversationData.CHILD2_OPTION = session.message.value.child2_option

      // var peopleValue = JSON.stringify(session.message.value)
      // session.endDialog({ response: peopleValue })
      session.endDialog()
      return
    }

    var msg = new builder.Message(session)
      .addAttachment(peopleNumCard)
    session.send(msg)
  }
  // function (session) {
  //   var msg = new builder.Message(session).addAttachment(peopleNumCard)
  //   session.send(msg)
  //   builder.Prompts.text(session, '객실 인원 추가 옵션을 선택해주시기 바랍니다')
  // }, function (session, results) {
  //   console.log(results)
  // }
])

bot.dialog('askBeginDate', [
  function (session) {
    if (session.message && session.message.value) {
      // 사용자가 선택한 값 출력
      console.log(session.message.value)
      var checkinDate = session.message.value.checkinDate
      var checkoutDate = session.message.value.checkoutDate

      session.endDialogWithResult({ response: checkinDate, response2: checkoutDate })
      return
    }

    var msg = new builder.Message(session).addAttachment(checkinCard)
    session.send(msg)
  }
])
