// sample_training db의 grades 컬렉션 사용
// class_id 기준 그루핑. exam, quiz에 대해서만 평균값 산출
// 최종 결과 스키마 예시
/*
{
    _id: 391, // class_id
    scores: [
        { type: 'exam', avg_scores: 50.23094823049 },
        { type: 'quiz', avg_scores: 50.23094823049 }
    ]
},
{
    _id: 175,
    scores: [
        { type: 'exam', avg_scores: 50.23094823049 },
        { type: 'quiz', avg_scores: 50.23094823049 }
    ]
}

SQL로 치환하자면 대충 이런 느낌
SELECT class_id, type, (SUM(score) / COUNT(student_id)) AS avg_scores
FROM grades
WHERE type IN ('exam', 'quiz')
GROUP BY class_id, type

*/

// 와 진짜 어렵다 하나도 모르겠다..!!

/*
원래 스키마
{
    _id: ObjectId("56d5f7eb604eb380b0d8d92b"),
    student_id: 9,
    scores: [
      { type: 'exam', score: 70.04226942707132 },
      { type: 'quiz', score: 95.54867661893962 },
      { type: 'homework', score: 33.66349576311476 },
      { type: 'homework', score: 65.74540822849171 }
    ],
    class_id: 470
  }

scores 배열에 접근하기 위해서는 $unwind로 풀어줘야 함
*/


db.grades.aggregate([
    {
        $unwind: '$scores'
    }
])

/*
scores 객체배열이 풀려서 같은 id이면서 scores의 데이터가 다른 객체배열이 생겼음
...
{
    _id: ObjectId("56d5f7eb604eb380b0d8d8e6"),
    student_id: 2,
    scores: { type: 'quiz', score: 18.791883239743868 },
    class_id: 435
  },
  {
    _id: ObjectId("56d5f7eb604eb380b0d8d8e6"),
    student_id: 2,
    scores: { type: 'homework', score: 84.6035293036351 },
    class_id: 435
  },
  {
    _id: ObjectId("56d5f7eb604eb380b0d8d8e6"),
    student_id: 2,
    scores: { type: 'homework', score: 85.59515854485495 },
    class_id: 435
  }
]
*/


db.grades.aggregate([
    {
        $unwind: '$scores' // scores 객체배열 해체하기
    },
    {
        $match: {
            'scores.type' : {
                $in: ['exam', 'quiz'] // scores.type이 exam이거나 quiz인 것만 걸러내기
            }
        }
    },
    {
        $group: {
            _id: { // 2개 이상의 필드로 GROUP BY 하는 경우 객체로 감싼다. (= GROUP BY class_id, type)
                class_id: '$class_id',
                type: '$scores.type'
            },
            avg_score: {
                $avg: '$scores.score'
            }
        }
    }
])

/*
...
{
  _id: { class_id: 285, type: 'exam' },
  avg_score: 47.291556133696055
},
{
  _id: { class_id: 131, type: 'quiz' },
  avg_score: 50.063013295969455
},
{
  _id: { class_id: 316, type: 'quiz' },
  avg_score: 48.45068887502395
}
]

score값이 다 흩어져있어서 class_id를 기준으로 scores라는 배열로 다시 만들어줘야한다
*/

db.grades.aggregate([
    {
        $unwind: '$scores' // scores 객체배열 해체하기
    },
    {
        $match: {
            'scores.type' : {
                $in: ['exam', 'quiz'] // scores.type이 exam이거나 quiz인 것만 걸러내기
            }
        }
    },
    {
        $group: {
            _id: { // 2개 이상의 필드로 GROUP BY 하는 경우 객체로 감싼다. (= GROUP BY class_id, type)
                class_id: '$class_id',
                type: '$scores.type'
            },
            avg_score: {
                $avg: '$scores.score'
            }
        }
    },
    {
        $group: {
            _id: '$_id.class_id', // 이전 group stage에서 만든 데이터에 접근. (= GROUP BY _id.class_id)
            scores: {
                $push: { // 배열에 값 넣기
                    type: '$_id.type',
                    avg_scores: '$avg_score'
                }
            }
        }
    }, // 이렇게만 해도 원하는 스키마의 데이터 생성 완료
    {
        $sort: {
            _id: -1
        }
    },
    {
        $limit: 5
    }
])

//---------------- 2번째 방법 -------------------

db.grades.aggregate([
    {
        $addFields: { // exam, quiz값이 들어갈 임시 필드를 추가
            tmp_scores: {
                $filter: { // scores에서 type이 exam, quiz인 것만 걸러내기
                    input: '$scores',
                    as: 'scores_var', // 변수 선언. scores배열 담음
                    cond: {
                        $or: [ // 사용자지정변수에는 달러2개$$ 사용
                            {$eq: ['$$scores_var.type', 'exam']},
                            {$eq: ['$$scores_var.type', 'quiz']},
                        ]
                    }

                }
            }
        }
    }
])

/*
{
    _id: ObjectId("56d5f7eb604eb380b0d8d92f"),
    student_id: 9,
    scores: [
      { type: 'exam', score: 38.46678249444119 },
      { type: 'quiz', score: 39.14430227344599 },
      { type: 'homework', score: 21.475133065687867 },
      { type: 'homework', score: 75.22532761012614 }
    ],
    class_id: 166,
    tmp_scores: [ // tmp_scores 필드가 추가됐음
      { type: 'exam', score: 38.46678249444119 },
      { type: 'quiz', score: 39.14430227344599 }
    ]
  },
  */

db.grades.aggregate([
    {
        $addFields: { // exam, quiz값이 들어갈 임시 필드를 추가
            tmp_scores: {
                $filter: { // scores에서 type이 exam, quiz인 것만 걸러내기
                    input: '$scores',
                    as: 'scores_var', // 변수 선언. scores배열 담음
                    cond: {
                        $or: [ // 사용자지정변수에는 달러2개$$ 사용
                            {$eq: ['$$scores_var.type', 'exam']},
                            {$eq: ['$$scores_var.type', 'quiz']},
                        ]
                    }

                }
            }
        }
    },
    { // $unset : 안쓰는 필드 제거하는 스테이지
        $unset: ['scores', 'student_id']
    }
])

/*
scores, student_id 필드 사라졌음
{
    _id: ObjectId("56d5f7eb604eb380b0d8d92b"),
    class_id: 470,
    tmp_scores: [
      { type: 'exam', score: 70.04226942707132 },
      { type: 'quiz', score: 95.54867661893962 }
    ]
  },
*/

db.grades.aggregate([
    {
        $addFields: { // exam, quiz값이 들어갈 임시 필드를 추가
            tmp_scores: {
                $filter: { // scores에서 type이 exam, quiz인 것만 걸러내기
                    input: '$scores',
                    as: 'scores_var', // 변수 선언. scores배열 담음
                    cond: {
                        $or: [ // 사용자지정변수에는 달러2개$$ 사용
                            {$eq: ['$$scores_var.type', 'exam']},
                            {$eq: ['$$scores_var.type', 'quiz']},
                        ]
                    }

                }
            }
        }
    },
    { // $unset : 안쓰는 필드 제거하는 스테이지
        $unset: ['scores', 'student_id']
    },
    { // exam, quiz를 구분하려면 객체배열을 풀어줘야 함
        $unwind: '$tmp_scores'
    },
    {
        $group: {
            _id: '$class_id',
            exam_scores: {
                $push: { // 배열에 값 넣기
                    $cond: { // $cond = condition
                        if: {
                            $eq: ['$tmp_scores.type', 'exam'] // if $tmp_scores.type === exam
                        },
                        then: '$tmp_scores.score',
                        else: '$$REMOVE' // $$REMOVE = 시스템변수. 삭제하는 역할
                    }
                }
            },
            quiz_scores: {
                $push: {
                    $cond: {
                        if: {
                            $eq: ['$tmp_scores.type', 'quiz']
                        },
                        then: '$tmp_scores.score',
                        else: '$$REMOVE'
                    }
                }
            }
        }
    }
])

/*
각 배열 안에 해당하는 score값이 모두 담겼음
...
{
    _id: 459,
    exam_scores: [
      62.675645269847344, 11.950080511330818,  22.18273323554949,
       95.21134809293169, 17.966506426605033,  90.35606147077665,
       68.82306437268866, 13.973963137046175, 15.250228962609869,
       8.050287828800274, 42.979243977138424,  24.69147522939754,
        98.3374625376252,  77.11629331443042,  82.89024721263121,
       94.80886359877924,  61.77175327886473, 2.6011241258693807,
    ],
    quiz_scores: [
       58.75868560101909,  61.044367443874684, 19.583468388193616,
       97.56152696826294,  32.524581574299305, 28.696867901406765,
       4.701043341351396,   70.09766062928445, 63.872603757965074,
       54.80859506322039,   50.04688325764805, 63.085014316394584,
    ]
  }
]
*/

db.grades.aggregate([
    {
        $addFields: { // exam, quiz값이 들어갈 임시 필드를 추가
            tmp_scores: {
                $filter: { // scores에서 type이 exam, quiz인 것만 걸러내기
                    input: '$scores',
                    as: 'scores_var', // 변수 선언. scores배열 담음
                    cond: {
                        $or: [ // 사용자지정변수에는 달러2개$$ 사용
                            {$eq: ['$$scores_var.type', 'exam']},
                            {$eq: ['$$scores_var.type', 'quiz']},
                        ]
                    }

                }
            }
        }
    },
    { // $unset : 안쓰는 필드 제거하는 스테이지
        $unset: ['scores', 'student_id']
    },
    { // exam, quiz를 구분하려면 객체배열을 풀어줘야 함
        $unwind: '$tmp_scores'
    },
    {
        $group: {
            _id: '$class_id',
            exam_scores: {
                $push: { // 배열에 값 넣기
                    $cond: { // $cond = condition
                        if: {
                            $eq: ['$tmp_scores.type', 'exam'] // if $tmp_scores.type === exam
                        },
                        then: '$tmp_scores.score',
                        else: '$$REMOVE' // $$REMOVE = 시스템변수. 삭제하는 역할
                    }
                }
            },
            quiz_scores: {
                $push: {
                    $cond: {
                        if: {
                            $eq: ['$tmp_scores.type', 'quiz']
                        },
                        then: '$tmp_scores.score',
                        else: '$$REMOVE'
                    }
                }
            }
        }
    },
    {
        $project: {
            _id: 1,
            scores: {
                $objectToArray: { // $objectToArray : object를 array 형태로 변경한다
                    exam: {
                        $avg: '$exam_scores'
                    },
                    quiz: {
                        $avg: '$quiz_scores'
                    }
                }
            }
        }
    },
    {
        $sort: {
            _id: -1
        }
    },
    {
        $limit: 5
    }
])

/*
[
  {
    _id: 487,
    scores: [
      { k: 'exam', v: 52.710159186099894 }, // 타입이름이 k, v로 나왔음
      { k: 'quiz', v: 46.14304242762729 }
    ] 
  },
  {
    _id: 430,
    scores: [
      { k: 'exam', v: 52.48577727719976 },
      { k: 'quiz', v: 50.719114897279326 }
    ]
  },
...
*/