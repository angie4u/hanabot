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
              'id': 'adult_option',
              'style': 'compact',
              'value': '성인 1',
              'choices': [
                {
                  'title': '성인 1',
                  'value': '성인 1'
                },
                {
                  'title': '성인 2(더블 요청)',
                  'value': '성인 2(더블 요청)'
                },
                {
                  'title': '성인 2(트윈 요청)',
                  'value': '성인 2(트윈 요청)'
                },
                {
                  'title': '성인 3',
                  'value': '성인 3'
                },
                {
                  'title': '성인 4',
                  'value': '성인 4'
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
                    'id': 'child1_option',
                    'style': 'compact',
                    'value': '선택안함',
                    'choices': [
                      {
                        'title': '아동1 추가',
                        'value': '선택안함'
                      },
                      {
                        'title': '0세',
                        'value': '0세'
                      },
                      {
                        'title': '만1세',
                        'value': '만1세'
                      },
                      {
                        'title': '만2세',
                        'value': '만2세'
                      },
                      {
                        'title': '만3세',
                        'value': '만3세'
                      },
                      {
                        'title': '만4세',
                        'value': '만4세'
                      },
                      {
                        'title': '만5세',
                        'value': '만5세'
                      },
                      {
                        'title': '만6세',
                        'value': '만6세'
                      },
                      {
                        'title': '만7세',
                        'value': '만7세'
                      },
                      {
                        'title': '만8세',
                        'value': '만8세'
                      },
                      {
                        'title': '만9세',
                        'value': '만9세'
                      },
                      {
                        'title': '만10세',
                        'value': '만10세'
                      },
                      {
                        'title': '만11세',
                        'value': '만11세'
                      }
                    ]
                  },
                  {
                    'type': 'Input.ChoiceSet',
                    'id': 'child2_option',
                    'style': 'compact',
                    'value': '선택안함',
                    'choices': [
                      {
                        'title': '아동2 추가',
                        'value': '선택안함'
                      },
                      {
                        'title': '0세',
                        'value': '0세'
                      },
                      {
                        'title': '만1세',
                        'value': '만1세'
                      },
                      {
                        'title': '만2세',
                        'value': '만2세'
                      },
                      {
                        'title': '만3세',
                        'value': '만3세'
                      },
                      {
                        'title': '만4세',
                        'value': '만4세'
                      },
                      {
                        'title': '만5세',
                        'value': '만5세'
                      },
                      {
                        'title': '만6세',
                        'value': '만6세'
                      },
                      {
                        'title': '만7세',
                        'value': '만7세'
                      },
                      {
                        'title': '만8세',
                        'value': '만8세'
                      },
                      {
                        'title': '만9세',
                        'value': '만9세'
                      },
                      {
                        'title': '만10세',
                        'value': '만10세'
                      },
                      {
                        'title': '만11세',
                        'value': '만11세'
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
