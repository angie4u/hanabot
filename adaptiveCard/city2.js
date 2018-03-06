exports.card = {
    'contentType': 'application/vnd.microsoft.card.adaptive',
    'content': {
      //내용
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "type": "AdaptiveCard",
    "version": "1.0",
    "speak": "<s>Your  meeting about \"Adaptive Card design session\"<break strength='weak'/> is starting at 12:30pm</s><s>Do you want to snooze <break strength='weak'/> or do you want to send a late notification to the attendees?</s>",
    "body": [
      {
        "type": "TextBlock",
        "text": "도시를 골라주세요",
        "size": "large",
        "weight": "bolder"
      }
      
    ],
    "actions": [
      {
        "type": "Action.Submit",
        "title": "도쿄",
        "data": "TYO"
      },
      {
        "type": "Action.Submit",
        "title": "오사카",
        "data": "OSA"
      },
      {
        "type": "Action.Submit",
        "title": "오키나와",
        "data": "OKA"
      },
      {
        "type": "Action.Submit",
        "title": "후쿠오카",
        "data": "FUK"
      },
      {
        "type": "Action.Submit",
        "title": "삿포로",
        "data": "SPK"
      },
      {
        "type": "Action.Submit",
        "title": "교토",
        "data": "UKY"
      },
      {
        "type": "Action.Submit",
        "title": "나고야",
        "data": "NGO"
      }
    ]
  
  
    }
  }
  
  