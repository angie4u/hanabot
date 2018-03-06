exports.card2 = {
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
            'text': '객실 인원선택',
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
            }
          ],
          'actions': [
            {
              'type': 'Action.ShowCard',
              'title': '아동 추가',
              'card': {
                'type': 'AdaptiveCard',
                'body': [
                  {
                    'type': 'Input.ChoiceSet',
                    'id': 'CompactSelectVal_child1',
                    'style': 'compact',
                    'value': '1',
                    'choices': [
                      {
                        'title': '아동1 추가',
                        'value': '1'
                      },
                      {
                        'title': '0세',
                        'value': '2'
                      },
                      {
                        'title': '만1세',
                        'value': '3'
                      },
                      {
                        'title': '만2세',
                        'value': '4'
                      },
                      {
                        'title': '만3세',
                        'value': '5'
                      },
                      {
                        'title': '만4세',
                        'value': '6'
                      },
                      {
                        'title': '만5세',
                        'value': '7'
                      },
                      {
                        'title': '만6세',
                        'value': '8'
                      },
                      {
                        'title': '만7세',
                        'value': '9'
                      },
                      {
                        'title': '만8세',
                        'value': '10'
                      },
                      {
                        'title': '만9세',
                        'value': '11'
                      },
                      {
                        'title': '만10세',
                        'value': '12'
                      },
                      {
                        'title': '만11세',
                        'value': '13'
                      }
                    ]
                  },
                  {
                    'type': 'Input.ChoiceSet',
                    'id': 'CompactSelectVal_child2',
                    'style': 'compact',
                    'value': '2',
                    'choices': [
                      {
                        'title': '아동2 추가',
                        'value': '2'
                      },
                      {
                        'title': '0세',
                        'value': '3'
                      },
                      {
                        'title': '만1세',
                        'value': '3'
                      },
                      {
                        'title': '만2세',
                        'value': '4'
                      },
                      {
                        'title': '만3세',
                        'value': '5'
                      },
                      {
                        'title': '만4세',
                        'value': '6'
                      },
                      {
                        'title': '만5세',
                        'value': '7'
                      },
                      {
                        'title': '만6세',
                        'value': '8'
                      },
                      {
                        'title': '만7세',
                        'value': '9'
                      },
                      {
                        'title': '만8세',
                        'value': '10'
                      },
                      {
                        'title': '만9세',
                        'value': '11'
                      },
                      {
                        'title': '만10세',
                        'value': '12'
                      },
                      {
                        'title': '만11세',
                        'value': '13'
                      }
                    ]
                  }
                ]
              }
            },
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
