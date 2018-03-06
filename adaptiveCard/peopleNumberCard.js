exports.card = {
  'contentType': 'application/vnd.microsoft.card.adaptive',
  'content': {
    '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
    'type': 'AdaptiveCard',
    'version': '1.0',
    'body': [
      {
        'type': 'Container',
        'items': [
          {
            'type': 'TextBlock',
            'text': '객실1 인원선택',
            'weight': 'bolder',
            'size': 'medium'
          }
        ]
      }
    ],
    'actions': [
      {
        'type': 'Action.ShowCard',
        'title': '인원 선택',
        'card': {
          'type': 'AdaptiveCard',
          'body': [
            {
              'type': 'Input.ChoiceSet',
              'id': 'CompactSelectVal_adult',
              'style': 'compact',
              'value': '1',
              'choices': [
                {
                  'title': '성인 1',
                  'value': '1'
                },
                {
                  'title': '성인 2(더블 요청)',
                  'value': '2'
                },
                {
                  'title': '성인 2(트윈 요청)',
                  'value': '3'
                },
                {
                  'title': '성인 3',
                  'value': '4'
                },
                {
                  'title': '성인 4',
                  'value': '5'
                }
              ]
            },
            {
              'type': 'Input.ChoiceSet',
              'id': 'CompactSelectVal_child',
              'style': 'compact',
              'value': '2',
              'choices': [
                {
                  'title': '아동0',
                  'value': '1'
                },
                {
                  'title': '아동1',
                  'value': '2'
                },
                {
                  'title': '아동2',
                  'value': '3'
                }
              ]
            }
          ],
          'actions': [
            {
              'type': 'Action.Submit',
              'title': 'OK'
            }
          ]
        }
      }
    ]
  }
}
