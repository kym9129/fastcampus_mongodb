// use sample_weatherdata
// data 컬렉션의 sections라는 배열 필드 사용

db.data.createIndex({sections: -1})

db.data.getIndexes()
/*
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  { v: 2, key: { sections: -1 }, name: 'sections_-1' }
]
*/

db.data.find({sections: 'AG1'}).explain('executionStats')

/*
선략
      inputStage: {
        stage: 'IXSCAN', // index scan
        nReturned: 10000,
        executionTimeMillisEstimate: 3,
        works: 10001,
        advanced: 10000,
        needTime: 0,
        needYield: 0,
        saveState: 10,
        restoreState: 10,
        isEOF: 1,
        keyPattern: { sections: -1 },
        indexName: 'sections_-1',
        isMultiKey: true, // 멀티키 인덱스라는 표시
        multiKeyPaths: { sections: [ 'sections' ] }, 
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: { sections: [ '["AG1", "AG1"]' ] }, // 인덱스를 탐색한 범위
후략
*/

// 객체배열 (=내장 도큐먼트)에 인덱스 추가
// use sample_training
// grades 컬렉션 사용
/*
scores: [
    { type: 'exam', score: 84.72636832669608 },
    { type: 'quiz', score: 7.8865616909793435 },
    { type: 'homework', score: 22.860114572528147 },
    { type: 'homework', score: 80.85669686147487 }
  ],
*/

db.grades.createIndex({"scores.type": 1})

db.grades.getIndexes()
/*
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  { v: 2, key: { 'scores.type': 1 }, name: 'scores.type_1' }
]
*/

db.grades.find(
    {"scores.type": "exam"}
).explain('executionStats')

/*
inputStage: {
        stage: 'IXSCAN', // <-
        nReturned: 100000,
        executionTimeMillisEstimate: 17,
        works: 100001,
        advanced: 100000,
        needTime: 0,
        needYield: 0,
        saveState: 100,
        restoreState: 100,
        isEOF: 1,
        keyPattern: { 'scores.type': 1 },
        indexName: 'scores.type_1',
        isMultiKey: true, // <-
        multiKeyPaths: { 'scores.type': [ 'scores' ] }, // <-
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: { 'scores.type': [ '["exam", "exam"]' ] }, // <-
        keysExamined: 100000,
        seeks: 1,
        dupsTested: 100000,
        dupsDropped: 0
      }
*/

// 인덱스 삭제하기
db.grades.dropIndex({"scores.type": 1}) // 인덱스 이름으로도 삭제 가능

// 복합인덱스 생성
db.grades.createIndex(
    {class_id: 1, "scores.type": 1}
)
/*
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  {
    v: 2,
    key: { class_id: 1, 'scores.type': 1 },
    name: 'class_id_1_scores.type_1'
  }
]
*/

db.grades.find(
    {
        "scores.type" : "exam",
        class_id: {
            $gte: 350
        }
    }
).explain('executionStats')

/*
멀티키 인덱스는 복합인덱스로도 사용할 수 있다

선략
inputStage: {
        stage: 'IXSCAN', // <0
        nReturned: 29995,
        executionTimeMillisEstimate: 33,
        works: 30147,
        advanced: 29995,
        needTime: 151,
        needYield: 0,
        saveState: 30,
        restoreState: 30,
        isEOF: 1,
        keyPattern: { class_id: 1, 'scores.type': 1 },
        indexName: 'class_id_1_scores.type_1',
        isMultiKey: true, // <-
        multiKeyPaths: { class_id: [], 'scores.type': [ 'scores' ] },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: {
          class_id: [ '[350, inf.0]' ],
          'scores.type': [ '["exam", "exam"]' ]
        },
        keysExamined: 30146,
        seeks: 152,
        dupsTested: 29995,
        dupsDropped: 0
      }
후략
*/