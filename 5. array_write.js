// 'test' db에 데이터 넣기
db.students.insertMany([
    { _id: 1, grades: [85, 80, 80] },
    { _id: 2, grades: [80, 90, 92] },
    { _id: 3, grades: [85, 100, 90] }
]);

// grades가 80인 '첫번째 값'을 82로 변경하기 (id=1)
db.students.updateOne(
    {_id: 1, grades: 80},
    {$set: {"grades.$": 82}}
);
/**
 * 
 * 결과 
[
  { _id: 1, grades: [ 85, 82, 80 ] },
  { _id: 2, grades: [ 80, 90, 92 ] },
  { _id: 3, grades: [ 85, 100, 90 ] }
]
 */

// 조건에 맞는 전체를 변경하기
// 모든 도큐먼트에 대해 모든 grade를 +10 하기
// .$[] = 배열 전체 (모든 인덱스?)
db.students.updateMany(
    {},
    {$inc: {'grades.$[]': 10}}
);
/*
[
    { _id: 1, grades: [ 95, 92, 90 ] },
    { _id: 2, grades: [ 90, 100, 102 ] },
    { _id: 3, grades: [ 95, 110, 100 ] }
]
*/

// insert 내장 도큐먼트 데이터
db.students.insertMany([
    {
        _id: 4,
        grades: [
            {grade:80, mean: 75, std:8},
            {grade:85, mean: 90, std:5},
            {grade:85, mean: 85, std:8},
        ]
    }
]);
/* 결과
[
    { _id: 1, grades: [ 95, 92, 90 ] },
    { _id: 2, grades: [ 90, 100, 102 ] },
    { _id: 3, grades: [ 95, 110, 100 ] },
    {
      _id: 4,
      grades: [
        { grade: 80, mean: 75, std: 8 },
        { grade: 85, mean: 90, std: 5 },
        { grade: 85, mean: 85, std: 8 }
      ]
    }
]
*/

// grade가 85인 첫번째 도큐먼트의 std를 6으로 변경
// $가 배열의 인덱스 역할을 해줌
db.students.updateOne(
    {_id: 4, 'grades.grade': 85},
    {$set: {'grades.$.std': 6}}
)
/* db.students.findOne({_id:4}) 결과
{
    _id: 4,
    grades: [
      { grade: 80, mean: 75, std: 8 },
      { grade: 85, mean: 90, std: 6 },
      { grade: 85, mean: 85, std: 8 }
    ]
  }
  */

// grades 배열의 모든 grade 요소를 변경
// 마찬가지로 .$[] 사용
db.students.updateOne(
    {_id: 4, grades:{$elemMatch: {grade: {$gte: 85}}}},
    {$set: {'grades.$[].grade': 100}}
);

db.students.insertMany([
    {
        _id: 5,
        grades: [
            {grade:90, mean: 75, std:8},
            {grade:87, mean: 90, std:6},
            {grade:85, mean: 85, std:8},
        ]
    }
]);

// 87 이상인 grade만 100으로 변경
// [identifier]: 변수에 값을 저장하는 것 처럼 사용
db.students.updateMany(
    {_id: 5},
    {$set: {'grades.$[element].grade' : 100}}, 
    { arrayFilters: [{'element.grade': {$gte: 87 }}] }
)
/*
{
    _id: 5,
    grades: [
      { grade: 100, mean: 75, std: 8 },
      { grade: 100, mean: 90, std: 6 },
      { grade: 85, mean: 85, std: 8 }
    ]
  }
*/

db.students.insertMany([
    {
        _id: 7,
        grades: [
            {type: 'quiz', questions: [10, 8, 5] },
            {type: 'quiz', questions: [8, 9, 6] },
            {type: 'hw', questions: [5, 4, 3] },
            {type: 'exam', questions: [25, 10, 23, 0] },
        ]
    }
]);

// if grades[i].questions[j] >= 8 then grades[i].questions[j] += 2
db.students.updateOne(
    {_id: 7},
    {$inc: {'grades.$[].questions.$[score]': 2}},
    {arrayFilters: [{score: {$gte: 8}}]}
)
/*
{
    _id: 7,
    grades: [
      { type: 'quiz', questions: [ 12, 10, 5 ] },
      { type: 'quiz', questions: [ 10, 11, 6 ] },
      { type: 'hw', questions: [ 5, 4, 3 ] },
      { type: 'exam', questions: [ 27, 12, 25, 0 ] }
    ]
  }
  */


db.shopping.insertMany([
    {
        _id: 1,
        cart: ['banana', 'cheeze', 'milk'],
        coupons: ['10%', '20%', '30%']
    },
    {
        _id: 2,
        cart: [],
        coupons: []
    }
])

// $addtoSet : 배열에 값이 없을 경우에만 삽입
db.shopping.updateOne(
    { _id: 1},
    {$addToSet: {cart:'beer'}}
)
// 한번 더 실행하면 업데이트 안됨

// 이렇게 실행하면 cart배열 안에 또다른 배열로 삽입되어버림
db.shopping.updateOne(
    { _id: 1},
    {$addToSet: {cart:['beer', 'candy']}}
)
// cart: [ 'banana', 'cheeze', 'milk', 'beer', [ 'beer', 'candy' ] ],

// $each
db.shopping.updateOne(
    { _id: 1},
    {$addToSet: {cart: { $each: ['beer', 'candy']} }}
)
/*
cart: [
    'banana',
    'cheeze',
    'milk',
    'beer',
    [ 'beer', 'candy' ],
    'candy'
  ]
*/

// $pull : 배열 요소 1개 삭제
db.shopping.updateOne(
    {_id: 1},
    {$pull: {cart: 'beer'}}
)
// cart: [ 'banana', 'cheeze', 'milk', [ 'beer', 'candy' ], 'candy' ],

// 특정 값의 배열 요소 다 삭제 : 조건절 만들면 됨
// 아까 넣은 ['beer', 'candy']와 'milk' 삭제하기
db.shopping.updateOne(
    { _id: 1 },
    { $pull: { cart: { $in: [ ['beer', 'candy'], 'milk' ] } } }
)
// cart: [ 'banana', 'cheeze', 'candy' ],

// $pop : 배열 첫번째와 끝 값을 제거
// 음수 : 첫번째 값 제거 / 양수 : 마지막 값 제거
db.shopping.updateOne(
    {_id: 1},
    {$pop: {cart: -1}}
)
//  cart: [ 'cheeze', 'candy' ],

// 여러 배열을 동시에 제어
// cart 마지막값과 coupons 첫번째값 삭제
db.shopping.updateOne(
    {_id: 1},
    {$pop: {cart: 1, coupons: -1}}
)
// { _id: 1, cart: [ 'cheeze' ], coupons: [ '20%', '30%' ] },

// $push : 배열 첫 or 끝에 값 추가.
// 음수 : 첫번째 위치에 추가 / 양수 : 마지막 위치에 추가
db.shopping.updateOne(
    {_id: 1},
    {$push: {cart: 'popcorn'}}
)
// cart: [ 'cheeze', 'popcorn' ],

db.shopping.updateOne(
    {_id: 1},
    {$push: { coupons: {$each: ['25%', '35%']} }}
)
// coupons: [ '20%', '30%', '25%', '35%' ]

// $position : 넣을 위치 지정
db.shopping.updateMany(
    {},
    {
        $push: {
            coupons: {
                $each: ['90%', '70%'],
                $position: 0
            }
        }
    }
)
// updateOne 했다가 updateMany 한번 더 실행함
/*
[
    {
      _id: 1,
      cart: [ 'cheeze', 'popcorn' ],
      coupons: [
        '90%', '70%',
        '90%', '70%',
        '20%', '30%',
        '25%', '35%'
      ]
    },
    { _id: 2, cart: [], coupons: [ '90%', '70%' ] }
  ]
  */

// $slice 배열 크기 지정.
// 크기 10인 배열에 $slice 5 치면 5개만 남고 나머지 5개는 삭제됨
// coupons 배열에 15%, 20%를 가장 왼쪽에(0번째) 추가하고 배열을 요소 5개만 남기고 나머진 삭제
db.shopping.updateMany(
    {},
    {
        $push: {
            coupons: {
                $each: ['15%', '20%'],
                $position: 0,
                $slice: 5
            }
        }
    }
)

/*
[
    {
      _id: 1,
      cart: [ 'cheeze', 'popcorn' ],
      coupons: [ '15%', '20%', '90%', '70%', '90%' ]
    },
    { _id: 2, cart: [], coupons: [ '15%', '20%', '90%', '70%' ] }
  ]
  */

// $sort
db.shopping.updateMany(
    {},
    {
        $push: {
            coupons: {
                $each: ['90%', '99%'],
                $position: -1, // 맨끝에 배치
                $sort: -1, // 내림차순 정렬. 맨끝에 배치했지만 젤 앞에 올것임
                $slice: 5, // 5개 제한
            }
        }
    }
)
/*
[
    {
      _id: 1,
      cart: [ 'cheeze', 'popcorn' ],
      coupons: [ '99%', '90%', '90%', '90%', '70%' ]
    },
    { _id: 2, cart: [], coupons: [ '99%', '90%', '90%', '70%', '20%' ] }
  ]
  */

// $addToSet, $pull 등은 배열 전체를 탐색하므로 배열 크기가 커지면 시간복잡도 상승하므로 사용 시 유의 필요