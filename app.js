require('dotenv-extended').load()

var restify = require('restify')
var builder = require('botbuilder')
var botbuilder_azure = require('botbuilder-azure')
var peopleNumCard = require('./adaptiveCard/peopleNumCard_v2.js').card
var checkinCard = require('./adaptiveCard/checkinCard.js').card
var cityCard = require('./adaptiveCard/city2.js').card
const https = require('https')
var cognitiveservices = require('botbuilder-cognitiveservices')

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
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env.AzureWebJobsStorage)
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient)

var bot = new builder.UniversalBot(connector, [
  function (session) {
    session.send('안녕하세요 만나서 반갑습니다!')
    session.beginDialog('askCityInfo')
  },
  function (session, results) {
    console.log('console 도시 선택=' + `${results.response}`)
    session.beginDialog('askBeginDate')
  },
  function (session) {
    session.beginDialog('askForPeopleNumber')
  },
  function (session) {
    session.send(`${session.conversationData.ADULT_OPTION}, 아이1:${session.conversationData.CHILD1_OPTION}, 아이2:${session.conversationData.CHILD2_OPTION}`)
    builder.Prompts.choice(session, '추가로 방을 예약하시겠습니까? ', '예|아니오', { listStyle: builder.ListStyle.button })
  },
  function (session, results, next) {
    if (results.response.entity === '예') {
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
]).set('storage', tableStorage)

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

var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL)
bot.recognizer(recognizer)
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

      // 체크인 일자 저장
      session.conversationData.CHECKIN = checkinDate
      // 체크아웃 일자 저장
      session.conversationData.CHECKOUT = checkoutDate

      session.send(`체크인:${checkinDate} / 체크아웃:${checkoutDate}`)
      builder.Prompts.choice(session, '예약 일정이 맞습니까? ', '예|아니오', { listStyle: builder.ListStyle.button })
    } else {
      var msg = new builder.Message(session).addAttachment(checkinCard)
      return session.send(msg)
    }
  }, function (session, results) {
    if (results.response.entity === '예') {
      session.endDialog()
    } else {
      session.replaceDialog('askBeginDate', { reprompt: true })
    }
  }
])

bot.dialog('LUIS_searchAll', [
  function (session, args, next) {
    // loggingService(session.message.text,"N/A","N/A")

    var countryEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Country')
    var regionEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Region')
    var checkinEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Checkin.Date')
    var checkoutEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Checkout.Date')
    var adultNumberEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Adult.Number')
    var productEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Product.Type')

    var country, region, checkin, checkout, adultNumber = ''
    if (countryEntity != null) {
      country = countryEntity.entity.replace(/(\s*)/g, '')
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
    next()
  }, function (session, results, next) {
    if (!session.conversationData.CHECKIN || !session.conversationData.CHECKOUT) {
      session.send('체크인 및 체크아웃 날짜를 다시 입력해주세요')
      return session.beginDialog('askBeginDate')
    }
    next()
  }, function (session, results, next) {
    if (!session.conversationData.ADULT_OPTION || (session.conversationData.ADULT_OPTION == '')) {
      return session.beginDialog('askForPeopleNumber')
    }
    next()
  }, function (session, results, next) {
    next()
  }, function (session, results) {
    let countryCondition = '출발도시:' + session.conversationData.CITYCODE + '\n'
    let dateCondition = '체크인:' + session.conversationData.CHECKIN + '체크아웃:' + session.conversationData.CHECKOUT + '\n'
    let peopleCondition = session.conversationData.ADULT_OPTION + '아이1:' + session.conversationData.CHILD1_OPTION + '아이2:' + session.conversationData.CHILD2_OPTION
    let searchCondition = countryCondition.concat(dateCondition, peopleCondition)

    session.send(searchCondition)
    session.save()
    session.conversationData = {}
  }
]).triggerAction({
  matches: 'Search.All',
  onSelectAction: (session, args, next) => {
    session.beginDialog(args.action, args)
  }
})

/// //////////////////////////////////////
// dw 추가 영역
bot.dialog('LUIS_answerRefund', [
  // function (session) {
  //   session.send('환불 관련 문의입니다. \
  //     예약 정보가 존재하는지 체크하고 \
  //       예약 정보가 존재하면 결재 여부를 체크 \
  //         결재했을 경우 환불하시겠습니까? 라고 문의 처리\
  //           환불 문의에 환불 이라고 할경우 환불 처리\
  //           그외의 경우 환불 안함 \
  //         결재가 없을 경우 결재 내역이 없습니다. 라고 출력 후 종료 \
  //       예약 정보가 없을 경우 예약건 없음 출력 후 종료'
  //     ),
  function (session) {
    session.send('환불 관련 문의입니다.')
    builder.Prompts.text(session, '예약 번호를 입력하세요.')
  },
  function (session, results) {
    session.dialogData.reservationNumber = results.response
    if (session.dialogData.reservationNumber == '1234') {
      session.send('예약 번호를 찾았습니다. 결재 정보를 체크 중입니다.')
      builder.Prompts.text(session, '결재 정보가 존재합니다 결재를 취소 하시겠습니까? 예/아니오')
    } else {
      session.send('환불 처리를 위한 예약정보가 없습니다. 종료')
      session.endDialog()
    }
  },
  function (session, results) {
    session.dialogData.reservationCancelYN = results.response
    if (session.dialogData.reservationCancelYN == '예') {
      session.send(`결재를 취소하고 예약을 종료합니다.<br/> 예약번호: ${session.dialogData.reservationNumber} <br/>`)
      session.endDialog()
    } else {
      session.send(`결재를 취소하지 않고 종료합니다.<br/> 예약번호: ${session.dialogData.reservationNumber} <br/>`)
      session.endDialog()
    }
  }]).triggerAction({
    matches: 'Answer.Refund'
  })
/// //////////////////////////////////////
// dw 추가 영역 종료

// =========================================================
// Bots Dialogs QnAMakerRecognizer start --추가
// =========================================================

var qnAMakerRecognizer = new cognitiveservices.QnAMakerRecognizer({
  // knowledgeBaseId: '5aa5a440-5939-411d-8279-3eb92e2d7253',
  // subscriptionKey: 'cc2c5764d57b4feaafa0480d0c355653',
  knowledgeBaseId: process.env.QNA_MAKER_KB_ID,
  subscriptionKey: process.env.QNA_MAKER_KEY,
  top: 4
})

var qnaMakerTools = new cognitiveservices.QnAMakerTools()
bot.library(qnaMakerTools.createLibrary())

var basicQnAMakerDialog = new cognitiveservices.QnAMakerDialog({
  recognizers: [qnAMakerRecognizer],
  defaultMessage: 'No match! Try changing the query terms!',
  qnaThreshold: 0.3,
  feedbackLib: qnaMakerTools
})

// Override to also include the knowledgebase question with the answer on confident matches
basicQnAMakerDialog.respondFromQnAMakerResult = function (session, qnaMakerResult) {
  var result = qnaMakerResult
  var response = 'FAQ 질문 입니다.:  \r\n  Q: ' + result.answers[0].questions[0] + '  \r\n A: ' + result.answers[0].answer
  session.send(response)
}

// Override to log user query and matched Q&A before ending the dialog
basicQnAMakerDialog.defaultWaitNextMessage = function (session, qnaMakerResult) {
  if (session.privateConversationData.qnaFeedbackUserQuestion != null && qnaMakerResult.answers != null && qnaMakerResult.answers.length > 0 &&
      qnaMakerResult.answers[0].questions != null && qnaMakerResult.answers[0].questions.length > 0 && qnaMakerResult.answers[0].answer != null) {
    console.log('User Query: ' + session.privateConversationData.qnaFeedbackUserQuestion)
    console.log('KB Question: ' + qnaMakerResult.answers[0].questions[0])
    console.log('KB Answer: ' + qnaMakerResult.answers[0].answer)
  }
  session.endDialog()
}

// =========================================================
// Bots Dialogs QnAMakerRecognizer end
// =========================================================

bot.dialog('LUIS_FAQ', basicQnAMakerDialog).triggerAction({
  matches: 'FAQ'
})

// 예약 관련 문의사항 응대 Dialog
bot.dialog('LUIS_modifyDate', [
  function (session, args) {
    // 사용자가 예약 번호를 입력하거나 아님 예약관련 문의를 준 경우
    session.send('예약 관련 문의를 주셨군요')
  }
]).triggerAction({
  matches: /^LG[0-9]+9$/i
})

bot.dialog('LUIS_answerCancel',
 function (session, args, next) {
  // Send a help message
   session.send('네~ 고객님^^ 고객님의 예약정보가 있는지 확인해보겠습니다.<br>잠시만 기다려주세요.')

   if (!checkReservedInfo()) {
     session.endDialog('고객님 예약정보가 존재하지 않습니다.<br>이전 대화로 돌아갑니다.')
   } else {
     session.endDialog('고객님 예약정보가 존재합니다. 취소 안내드립니다...')
   }
 })
 // Once triggered, will start a new dialog as specified by
 // the 'onSelectAction' option.
 .triggerAction({
   matches: 'Answer.Cancel',
   onSelectAction: (session, args, next) => {
     session.beginDialog(args.action, args)
     console.log('A2')
   }
 })

function checkReservedInfo () {
  return false
}

// function loggingService (question, answer, confidence) {
// //var logValue = '호텔 추천해줘/좋은 호텔이 많습니다./50';
//   var logValue = question+'/'+answer+'/'+confidence
//   var azureFuntionUrl = process.env.AzureFunctionUrl

//   https.get(azureFuntionUrl + logValue, (resp) => {
//     let data = '';

//     // A chunk of data has been recieved.
//     resp.on('data', (chunk) => {
//       data += chunk;
//     });

//     // The whole response has been received. Print out the result.
//     resp.on('end', () => {
//       //console.log(JSON.parse(data).explanation);
//     });
//   }
// }
