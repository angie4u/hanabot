require('dotenv-extended').load()

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
// const connString = 'DefaultEndpointsProtocol=https;AccountName=hanatour9833;AccountKey=6jqh42QQjWWBwoPGGR/Jr0PZjhBMZVbHm/gkhEfHvOj8aV6+oI8ed6ZAAwB5m793WqyQDiduJJB0QpseJwqYxw==;EndpointSuffix=core.windows.net'
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env.AzureWebJobsStorage)
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient)

var bot = new builder.UniversalBot(connector, [
  function (session) {
    session.send('안녕하세요 만나서 반갑습니다!')
    session.beginDialog('askCityInfo')
  },
  function (session, results) {
    console.log('console 도시 선택=' + `${results.response}`)

    // session.conversationData.CITYCODE = results.response
    // session.send('session 정보= ' + session.conversationData.CITYCODE)

    session.beginDialog('askBeginDate')
  },
  function (session, results) {
    // 출력
    // session.send('session 정보= ' + JSON.stringify(session.conversationData))

    session.send(`체크인:${session.conversationData.CHECKIN} / 체크아웃: ${session.conversationData.CHECKOUT}`)
    // builder.Prompts.text(session, `체크인 및 체크아웃 일정은 ${results.response}과 같습니다.`)
    builder.Prompts.choice(session, '예약 일정이 맞습니까? ', '예|아니오', { listStyle: builder.ListStyle.button })
  },
  function (session, results) {
    if (results.response.entity === '예') {
      session.beginDialog('askForPeopleNumber')
    } else {
      session.replaceDialog('askBeginDate', { reprompt: true })
    }
  },
  function (session) {
    session.send(`${session.conversationData.ADULT_OPTION}, 아이1:${session.conversationData.CHILD1_OPTION}, 아이2:${session.conversationData.CHILD2_OPTION}`)
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
const luis = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/e3fd6d0a-9b70-4a1b-ae81-b779db93024a?subscription-key=c4ac39be736d47598ab8ca33b5cccd7c&verbose=true&timezoneOffset=0&q='
var recognizer = new builder.LuisRecognizer(luis)
bot.recognizer(recognizer)
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
    session.conversationData.CITYCODE = results.response
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

      if (session.conversationData.CHILD1_OPTION === undefined) {
        session.conversationData.CHILD1_OPTION = '선택안함'
      } if (session.conversationData.CHILD2_OPTION === undefined) {
        session.conversationData.CHILD2_OPTION = '선택안함'
      }
      // var peopleValue = JSON.stringify(session.message.value)
      // session.endDialog({ response: peopleValue })
      session.endDialog()
      return
    }

    var msg = new builder.Message(session)
      .addAttachment(peopleNumCard)
    session.send(msg)
  }

])

bot.dialog('askBeginDate', [
  function (session) {
    if (session.message && session.message.value) {
      // 사용자가 선택한 값 출력
      console.log(session.message.value)
      var checkinDate = session.message.value.checkinDate
      var checkoutDate = session.message.value.checkoutDate

      // 일자인 저장
      session.conversationData.CHECKIN = checkinDate
      // 체크아웃 일자 저장
      session.conversationData.CHECKOUT = checkoutDate

      return session.endDialogWithResult({ response: checkinDate, response2: checkoutDate })
    }

    var msg = new builder.Message(session).addAttachment(checkinCard)
    session.send(msg)
  }
])

// Search.All
// 베트남 호텔에 금연룸으로 검색해줘
bot.dialog('LUIS_searchAll', [
  function (session, args) {
    var countryEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Country')
    var regionEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Region')
    var checkinEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Checkin.Date')
    var checkoutEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Checkout.Date')
    var adultNumberEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Adult.Number')
    var productEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Product.Type')

    // var country, checkin, checkout, adultNumber = ''
    var country, region, checkin, checkout, adultNumber = ''
    if (countryEntity != null) {
      country = countryEntity.entity.replace(/(\s*)/g, '')
      // session.conversationData.CITYCODE = country
    }
    if (regionEntity != null) {
      region = regionEntity.entity.replace(/(\s*)/g, '')
      session.conversationData.CITYCODE = region
    }
    if (checkinEntity != null) {
      checkin = checkinEntity.entity.replace(/(\s*)/g, '')
      session.conversationData.CHECKIN = checkin
    }
    if (checkoutEntity != null) {
      checkout = checkoutEntity.entity.replace(/(\s*)/g, '')
      session.conversationData.CHECKOUT = checkout
    }
    if (adultNumberEntity != null) {
      adultNumber = adultNumberEntity.entity.replace(/(\s*)/g, '')
      session.conversationData.ADULT_OPTION = adultNumber
    }

    session.send(`현재 상태는... 국가:${country},지역:${region},체크인:${checkin},체크아웃:${checkout},인원:${adultNumber}`)
    session.send('호텔 조회시 필수 정보들이 누락되어있습니다.')

    if (!session.conversationData.CITYCODE) {
      session.send('가시고 싶은 여행지를 선택해주세요')
      return session.beginDialog('askCityInfo')
    }
  }, function (session, results, next) {
    session.send(results.response)
    if (!session.conversationData.CHECKIN || !session.conversationData.CHECKOUT) {
      session.send('체크인 및 체크아웃 날짜를 다시 입력해주세요')
      return session.beginDialog('askBeginDate')
    }
    next()
  }, function (session, results, next) {
    builder.Prompts.text(session, results.response)
  }, function (session, results, next) {
    if (!session.conversationData.ADULT_OPTION) {
      return session.beginDialog('askForPeopleNumber')
    }
    next()
  }, function (session, results) {
    // session.send(results.response)

     // 모든 조건을 만족한 경우
    let countryCondition = '출발도시:' + session.conversationData.CITYCODE + '\n'
    let dateCondition = '체크인:' + session.conversationData.CHECKIN + '체크아웃:' + session.conversationData.CHECKOUT + '\n'
    let peopleCondition = session.conversationData.ADULT_OPTION + '아이1:' + session.conversationData.CHILD1_OPTION + '아이2:' + session.conversationData.CHILD2_OPTION
    let searchCondition = countryCondition.concat(dateCondition, peopleCondition)

    session.send(searchCondition)
    session.save()
    session.conversationData = {}
  }
]).triggerAction({
  matches: 'Search.All'
})

bot.dialog('LUIS_answerCancel', [
  function (session) {
    // session.send('예약 취소 관련 문의')
    builder.Prompt.text(session, '예약 취소 관련 문의')
  }, function (session, results) {
    var userResponse = results.response
  }
]).triggerAction({
  matches: 'Answer.Cancel'
})

bot.dialog('FAQ', [
  function (session, args) {
    // faq 질문이므로 QnA Maker를 통해 처리합니다.
    session.send('faq 질문이므로 QnA Maker를 통해 처리합니다')
    var userQuestion = session.message.text.replace(/(\s*)/g, '')
    console.log(userQuestion)
  }
]).triggerAction({
  matches: 'FAQ'
})
