var builder = require('botbuilder')
var checkinCard = require('./adaptiveCard/checkinCard.js').card

module.exports = [
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
]
