// use sample_restaurants

db.restaurants.findOne()

db.restaurants.find(
    {borough: 'Brooklyn'}
).explain()

/*
{
  explainVersion: '1',
  queryPlanner: {
    namespace: 'sample_restaurants.restaurants',
    indexFilterSet: false,
    parsedQuery: { borough: { '$eq': 'Brooklyn' } },
    maxIndexedOrSolutionsReached: false,
    maxIndexedAndSolutionsReached: false,
    maxScansToExplodeReached: false,
    winningPlan: { // <-
      stage: 'COLLSCAN',
      filter: { borough: { '$eq': 'Brooklyn' } },
      direction: 'forward'
    },
    rejectedPlans: []
  },
  command: {
    find: 'restaurants',
    filter: { borough: 'Brooklyn' },
    '$db': 'sample_restaurants'
  },
  serverInfo: {
    host: 'ac-bocoq0n-shard-00-01.xhpozmz.mongodb.net',
    port: 27017,
    version: '5.0.15',
    gitVersion: '935639beed3d0c19c2551c93854b831107c0b118'
  },
  serverParameters: {
    internalQueryFacetBufferSizeBytes: 104857600,
    internalQueryFacetMaxOutputDocSizeBytes: 104857600,
    internalLookupStageIntermediateDocumentMaxSizeBytes: 16793600,
    internalDocumentSourceGroupMaxMemoryBytes: 104857600,
    internalQueryMaxBlockingSortMemoryUsageBytes: 33554432,
    internalQueryProhibitBlockingMergeOnMongoS: 0,
    internalQueryMaxAddToSetBytes: 104857600,
    internalDocumentSourceSetWindowFieldsMaxMemoryBytes: 104857600
  },
  ok: 1,
  '$clusterTime': {
    clusterTime: Timestamp({ t: 1679644630, i: 2 }),
    signature: {
      hash: Binary(Buffer.from("c8ba5f37cb9709f2687770cad7bc76cd31fbba75", "hex"), 0),
      keyId: Long("7175942198930702338")
    }
  },
  operationTime: Timestamp({ t: 1679644630, i: 2 })
}
*/

db.restaurants.find(
    {borough: 'Brooklyn'}
).explain('executionStats')

/*
{
  explainVersion: '1',
  queryPlanner: {
    namespace: 'sample_restaurants.restaurants',
    indexFilterSet: false,
    parsedQuery: { borough: { '$eq': 'Brooklyn' } },
    maxIndexedOrSolutionsReached: false,
    maxIndexedAndSolutionsReached: false,
    maxScansToExplodeReached: false,
    winningPlan: {
      stage: 'COLLSCAN',
      filter: { borough: { '$eq': 'Brooklyn' } },
      direction: 'forward'
    },
    rejectedPlans: []
  },
  executionStats: { // <-
    executionSuccess: true,
    nReturned: 6086, // 반환된 도큐먼트 수
    executionTimeMillis: 16, // 쿼리 수행된 시간
    totalKeysExamined: 0, // 인덱스 엔트리를 얼마나 읽었는지. 0 : indexScan 말고 collectionScan했다는 뜻
    totalDocsExamined: 25359, // 결과 반환까지 조회한 총 도큐먼트 수
    executionStages: { // 스테이지가 여러개 있을 경우 depth가 더 생김. 가장 안쪽 depth의 stage부터 수행됨
      stage: 'COLLSCAN',
      filter: { borough: { '$eq': 'Brooklyn' } },
      nReturned: 6086,
      executionTimeMillisEstimate: 2,
      works: 25361,
      advanced: 6086,
      needTime: 19274,
      needYield: 0,
      saveState: 25,
      restoreState: 25,
      isEOF: 1,
      direction: 'forward',
      docsExamined: 25359
    }
  },
 // 후략
*/

// 스테이지가 여러개인 쿼리
db.restaurants.find(
    {borough: 'Brooklyn'}, // filter stage
    {name: 1, borough: 1} // projection stage
).explain('executionStats')

/*
// 선략
  executionStats: {
    executionSuccess: true,
    nReturned: 6086,
    executionTimeMillis: 19,
    totalKeysExamined: 0,
    totalDocsExamined: 25359,
    executionStages: {
      stage: 'PROJECTION_SIMPLE', // 2nd projection stage
      nReturned: 6086,
      executionTimeMillisEstimate: 1,
      works: 25361,
      advanced: 6086,
      needTime: 19274,
      needYield: 0,
      saveState: 25,
      restoreState: 25,
      isEOF: 1,
      transformBy: { name: 1, borough: 1 },
      inputStage: { // 1st filter stage
        stage: 'COLLSCAN',
        filter: { borough: { '$eq': 'Brooklyn' } },
        nReturned: 6086, // 쿼리 조건에 매칭된 도큐먼트 수
        executionTimeMillisEstimate: 1,
        works: 25361, // 쿼리 실행에 발생한 작업 단위 수 (얼마나 많은 일이 실행됐는지 확인 가능)
        advanced: 6086, // 부모 스테이지로 넘긴 결과 수 -> 도큐먼트를 다 읽는 과정 + 추가 작업 => 최종적으로 6086개 결과 나왔음
        needTime: 19274,
        needYield: 0,
        saveState: 25,
        restoreState: 25,
        isEOF: 1,
        direction: 'forward',
        docsExamined: 25359
      }
    }
  },
// 후략
*/

// filter -> projection -> sort stage
db.restaurants.find(
    {borough: 'Brooklyn'},
    {name: 1, borough: 1}
).sort({name: 1}).explain('executionStats')

/*
// ...
    executionStages: {
      stage: 'SORT', // 3rd
      nReturned: 6086,
      executionTimeMillisEstimate: 7,
      works: 31448,
      advanced: 6086,
      needTime: 25361,
      needYield: 0,
      saveState: 31,
      restoreState: 31,
      isEOF: 1,
      sortPattern: { name: 1 },
      memLimit: 33554432,
      type: 'simple',
      totalDataSizeSorted: 778083,
      usedDisk: false,
      inputStage: { // 2nd
        stage: 'PROJECTION_SIMPLE',
        nReturned: 6086,
        executionTimeMillisEstimate: 2,
        works: 25361,
        advanced: 6086,
        needTime: 19274,
        needYield: 0,
        saveState: 31,
        restoreState: 31,
        isEOF: 1,
        transformBy: { name: 1, borough: 1 },
        inputStage: { // 1st
          stage: 'COLLSCAN',
          filter: { borough: { '$eq': 'Brooklyn' } },
          nReturned: 6086,
          executionTimeMillisEstimate: 2,
          works: 25361,
          advanced: 6086,
          needTime: 19274,
          needYield: 0,
          saveState: 31,
          restoreState: 31,
          isEOF: 1,
          direction: 'forward',
          docsExamined: 25359
        }
      }

// ...

개선해야 할 부분
- collection scan이 발생하고 있음
- 6086건의 결과를 가져오기 위해 25359건의 도큐먼트를 조회하고 있음

-> 인덱스 생성 필요

*/

// borough 내림차순 인덱스 생성
db.restaurants.createIndex({borough: -1})

db.restaurants.find(
    {borough: 'Brooklyn'},
    {name: 1, borough: 1}
).sort({name: 1}).explain('executionStats')

/*
// ...
    rejectedPlans: [] // <- 인덱스가 하나밖에 없어서 rejected Plans 없음
  },
  executionStats: {
    executionSuccess: true,
    nReturned: 6086, // 6086개를 리턴. 효율적임
    executionTimeMillis: 23,
    totalKeysExamined: 6086, // 6086개를 조회
    totalDocsExamined: 6086,
    executionStages: {
      stage: 'SORT',
      nReturned: 6086,
      executionTimeMillisEstimate: 12,
      works: 12174,
      advanced: 6086,
      needTime: 6087,
      needYield: 0,
      saveState: 12,
      restoreState: 12,
      isEOF: 1,
      sortPattern: { name: 1 },
      memLimit: 33554432,
      type: 'simple',
      totalDataSizeSorted: 778083,
      usedDisk: false,
      inputStage: {
        stage: 'PROJECTION_SIMPLE',
        nReturned: 6086,
        executionTimeMillisEstimate: 5,
        works: 6087,
        advanced: 6086,
        needTime: 0,
        needYield: 0,
        saveState: 12,
        restoreState: 12,
        isEOF: 1,
        transformBy: { name: 1, borough: 1 },
        inputStage: {
          stage: 'FETCH',
          nReturned: 6086,
          executionTimeMillisEstimate: 0,
          works: 6087,
          advanced: 6086,
          needTime: 0,
          needYield: 0,
          saveState: 12,
          restoreState: 12,
          isEOF: 1,
          docsExamined: 6086,
          alreadyHasObj: 0,
          inputStage: {
            stage: 'IXSCAN', // <- 인덱스 스캔
            nReturned: 6086,
            executionTimeMillisEstimate: 0,
            works: 6087,
            advanced: 6086,
            needTime: 0,
            needYield: 0,
            saveState: 12,
            restoreState: 12,
            isEOF: 1,
            keyPattern: { borough: -1 },
            indexName: 'borough_-1',
            isMultiKey: false,
            multiKeyPaths: { borough: [] },
            isUnique: false,
            isSparse: false,
            isPartial: false,
            indexVersion: 2,
            direction: 'forward',
            indexBounds: { borough: [ '["Brooklyn", "Brooklyn"]' ] },
            keysExamined: 6086,
            seeks: 1,
            dupsTested: 0,
            dupsDropped: 0
          }
        }
      }
    }
// ...

*/

// 인덱스 추가해서 rejected Plan도 확인하기
db.restaurants.createIndex(
    { name: 1, borough: -1 }
    )


db.restaurants.find(
    {borough: 'Brooklyn'},
    {name: 1, borough: 1}
).sort({name: 1}).explain('executionStats')

/*
// ...
    winningPlan: {
      stage: 'PROJECTION_SIMPLE',
      transformBy: { name: 1, borough: 1 },
      inputStage: {
        stage: 'FETCH',
        filter: { borough: { '$eq': 'Brooklyn' } },
        inputStage: {
          stage: 'IXSCAN',
          keyPattern: { name: 1, borough: -1 },
          indexName: 'name_1_borough_-1',
          isMultiKey: false,
          multiKeyPaths: { name: [], borough: [] },
          isUnique: false,
          isSparse: false,
          isPartial: false,
          indexVersion: 2,
          direction: 'forward',
          indexBounds: {
            name: [ '[MinKey, MaxKey]' ],
            borough: [ '[MaxKey, MinKey]' ]
          }
        }
      }
    },
    rejectedPlans: [ // <-
      {
        stage: 'SORT',
        sortPattern: { name: 1 },
        memLimit: 33554432,
        type: 'simple',
        inputStage: {
          stage: 'PROJECTION_SIMPLE',
          transformBy: { name: 1, borough: 1 },
          inputStage: {
            stage: 'FETCH',
            inputStage: {
              stage: 'IXSCAN',
              keyPattern: { borough: -1 },
              indexName: 'borough_-1',
              isMultiKey: false,
              multiKeyPaths: { borough: [] },
              isUnique: false,
              isSparse: false,
              isPartial: false,
              indexVersion: 2,
              direction: 'forward',
              indexBounds: { borough: [ '["Brooklyn", "Brooklyn"]' ] }
            }
          }
        }
      }
    ]
// ...
*/

// rejectedPlans에 대한 executionStats도 보기
db.restaurants.find(
    {borough: 'Brooklyn'},
    {name: 1, borough: 1}
).sort({name: 1}).explain('allPlansExecution')

// rule based optimizer
// 특정 규칙에 의해 실행계획을 선택. 내부적 안전장치 존재
// 후보 계획을 전부 실행한 다음 가장 빨리 반환하는 계획을 선택함. 선택받지 못한 계획들은 리턴하지 못했기 때문에 0으로 나옴
// rejected Plans의 nReturned는 반환하지 못했기 때문에 0건으로 뜬다

// aggregate에서의 실행계획
ㅊ

// stage flow : ixscan -> fetch -> projection_simple (quisine필드만 사용) 즉, group 스테이지에서 cuisine만 필요하기 때문에 나머지 필드를 제거하였음



db.restaurants.aggregate([
    {
        $match: {borough: "Brooklyn"}
    },
    {
        $match: {cuisine: 'American'}
    }
]).explain('executionStats')
// match를 2개를 넣어도 하나의 스테이지에서 처리한다는걸 실행계획에서 확인할 수 있음
// $match: {borough: "Brooklyn", cuisine: 'American'} <- 내부적으로 이렇게 바꿔줌


// 에그리게이트 순서 변경
// 쿼리에선 group -> match -> sort 순으로 되어있지만 실제 실행은 match -> group에서 필요한 필드 프로젝션 순으로 실행된다는 걸 확인할 수 있음
db.restaurants.aggregate([
    {
        $group: {
            _id: {cuisine: "$cuisine", borough: "$borough"},
            cnt: {$sum: 1}
        }
    },
    {
        $match: {"_id.borough": "Queens"}
    },
    {
        $sort: {
            "_id.borough": 1
        }
    }
]).explain('executionStats')