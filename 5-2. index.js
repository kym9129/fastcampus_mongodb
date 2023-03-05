// use sample_training

db.zips.findOne()
/*
{
  _id: ObjectId("5c8eccc1caa187d17ca6ed18"),
  city: 'ACMAR',
  zip: '35004',
  loc: { y: 33.584132, x: 86.51557 },
  pop: 6055,
  state: 'AL'
}
*/

// state, city, pop으로 인덱스 사용해보기

// 인덱스 조회
db.zips.getIndexes()
// [ { v: 2, key: { _id: 1 }, name: '_id_' } ]
// _id에 대해서는 기본적으로 인덱스 생성됨 (PK)


// 실행계획 보기 : .explain('executionStats')
db.zips.find(
    {
        state: "LA",
        pop: { $gte: 40000 }
    }
).sort({city: 1}).explain('executionStats')

/*
{
    explainVersion: '1',
    queryPlanner: {
      namespace: 'sample_training.zips',
      indexFilterSet: false,
      parsedQuery: {
        '$and': [ { state: { '$eq': 'LA' } }, { pop: { '$gte': 40000 } } ]
      },
      maxIndexedOrSolutionsReached: false,
      maxIndexedAndSolutionsReached: false,
      maxScansToExplodeReached: false,
      winningPlan: {
        stage: 'SORT',
        sortPattern: { city: 1 },
        memLimit: 33554432,
        type: 'simple',
        inputStage: {
          stage: 'COLLSCAN',
          filter: {
            '$and': [ { state: { '$eq': 'LA' } }, { pop: { '$gte': 40000 } } ]
          },
          direction: 'forward'
        }
      },
      rejectedPlans: []
    },
    executionStats: {
      executionSuccess: true,
      nReturned: 13, // 반환된 도큐먼트 수
      executionTimeMillis: 20, // 실행시간(ms)
      totalKeysExamined: 0, // 인덱스 키를 몇개나 탐색했는지
      totalDocsExamined: 29470, // 도큐면트를 몇개나 조회했는지... 문제 : 13개 도큐먼트 반환하기 위해 약 3만개의 도큐먼트를 뒤졌음
      executionStages: {
        stage: 'SORT', // 정렬도 해서 sort stage도 이루어졌음
        nReturned: 13,
        executionTimeMillisEstimate: 1,
        works: 29486,
        advanced: 13,
        needTime: 29472,
        needYield: 0,
        saveState: 29,
        restoreState: 29,
        isEOF: 1,
        sortPattern: { city: 1 },
        memLimit: 33554432,
        type: 'simple',
        totalDataSizeSorted: 1885,
        usedDisk: false,
        inputStage: {
          stage: 'COLLSCAN', // 인덱스 없어서 컬렉션 전체 스캔 = collections scan
          filter: {
            '$and': [ { state: { '$eq': 'LA' } }, { pop: { '$gte': 40000 } } ]
          },
          nReturned: 13,
          executionTimeMillisEstimate: 1,
          works: 29472,
          advanced: 13,
          needTime: 29458,
          needYield: 0,
          saveState: 29,
          restoreState: 29,
          isEOF: 1,
          direction: 'forward',
          docsExamined: 29470
        }
      }
    },
    command: {
      find: 'zips',
      filter: { state: 'LA', pop: { '$gte': 40000 } },
      sort: { city: 1 },
      '$db': 'sample_training'
    },
    serverInfo: {
      host: 'ac-bocoq0n-shard-00-02.xhpozmz.mongodb.net',
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
      clusterTime: Timestamp({ t: 1678010632, i: 2 }),
      signature: {
        hash: Binary(Buffer.from("a873e686fac98a2f2abeb357e238b0c5f11109a9", "hex"), 0),
        keyId: Long("7175942198930702338")
      }
    },
    operationTime: Timestamp({ t: 1678010632, i: 2 })
  }
*/

// 인덱스 생성. 1 오름차순 -1 내림차순
db.zips.createIndex({state: 1})
db.zips.getIndexes()
/*
[
    { v: 2, key: { _id: 1 }, name: '_id_' },
    { v: 2, key: { state: 1 }, name: 'state_1' }
]
*/

// 인덱스 생성 후 다시 쿼리 실행, 실행계획 확인
db.zips.find(
    {
        state: "LA",
        pop: { $gte: 40000 }
    }
).sort({city: 1}).explain('executionStats')

/*
{
    explainVersion: '1',
    queryPlanner: {
      namespace: 'sample_training.zips',
      indexFilterSet: false,
      parsedQuery: {
        '$and': [ { state: { '$eq': 'LA' } }, { pop: { '$gte': 40000 } } ]
      },
      maxIndexedOrSolutionsReached: false,
      maxIndexedAndSolutionsReached: false,
      maxScansToExplodeReached: false,
      winningPlan: {
        stage: 'SORT',
        sortPattern: { city: 1 },
        memLimit: 33554432,
        type: 'simple',
        inputStage: {
          stage: 'FETCH',
          filter: { pop: { '$gte': 40000 } },
          inputStage: {
            stage: 'IXSCAN',
            keyPattern: { state: 1 },
            indexName: 'state_1',
            isMultiKey: false,
            multiKeyPaths: { state: [] },
            isUnique: false,
            isSparse: false,
            isPartial: false,
            indexVersion: 2,
            direction: 'forward',
            indexBounds: { state: [ '["LA", "LA"]' ] }
          }
        }
      },
      rejectedPlans: []
    },
    executionStats: {
      executionSuccess: true,
      nReturned: 13,
      executionTimeMillis: 1, // 20ms -> 1ms로 줄었음
      totalKeysExamined: 469, // 인덱스 키 469개 탐색
      totalDocsExamined: 469, // 탐색 도큐먼트 수도 약 3만개 -> 469개로 줄었음
      executionStages: {
        stage: 'SORT', // (4) 3에서 받은 docs를 sorting
        nReturned: 13,
        executionTimeMillisEstimate: 0,
        works: 484,
        advanced: 13,
        needTime: 470,
        needYield: 0,
        saveState: 0,
        restoreState: 0,
        isEOF: 1,
        sortPattern: { city: 1 },
        memLimit: 33554432,
        type: 'simple',
        totalDataSizeSorted: 1885,
        usedDisk: false,
        inputStage: {
          stage: 'FETCH',
          filter: { pop: { '$gte': 40000 } }, // (2) 1에서 가져온 469개 docs를 필터링
          nReturned: 13, // (3) 필터링 결과 13개 docs를 다음 스테이지로 보냄
          executionTimeMillisEstimate: 0,
          works: 470,
          advanced: 13,
          needTime: 456,
          needYield: 0,
          saveState: 0,
          restoreState: 0,
          isEOF: 1,
          docsExamined: 469,
          alreadyHasObj: 0,
          inputStage: {
            stage: 'IXSCAN', // 인덱스 스캔
            nReturned: 469, // (1) 인덱스 스캔으로 나온 469개 도큐먼트를 다음 스테이지로 보냄
            executionTimeMillisEstimate: 0,
            works: 470,
            advanced: 469,
            needTime: 0,
            needYield: 0,
            saveState: 0,
            restoreState: 0,
            isEOF: 1,
            keyPattern: { state: 1 },
            indexName: 'state_1',
            isMultiKey: false,
            multiKeyPaths: { state: [] },
            isUnique: false,
            isSparse: false,
            isPartial: false,
            indexVersion: 2,
            direction: 'forward',
            indexBounds: { state: [ '["LA", "LA"]' ] },
            keysExamined: 469,
            seeks: 1,
            dupsTested: 0,
            dupsDropped: 0
          }
        }
      }
    },
    command: {
      find: 'zips',
      filter: { state: 'LA', pop: { '$gte': 40000 } },
      sort: { city: 1 },
      '$db': 'sample_training'
    },
    serverInfo: {
      host: 'ac-bocoq0n-shard-00-02.xhpozmz.mongodb.net',
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
      clusterTime: Timestamp({ t: 1678010888, i: 2 }),
      signature: {
        hash: Binary(Buffer.from("6f7eb7097f6e284a80147ab4b03464b835515dbd", "hex"), 0),
        keyId: Long("7175942198930702338")
      }
    },
    operationTime: Timestamp({ t: 1678010888, i: 2 })
}
*/

// ESR rule 적용 시
// state 동등조건, city 정렬, pop 범위조건
db.zips.createIndex({ state: 1, city: 1, pop: 1 })

db.zips.getIndexes()
/*
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  { v: 2, key: { state: 1 }, name: 'state_1' },
  {
    v: 2,
    key: { state: 1, city: 1, pop: 1 },
    name: 'state_1_city_1_pop_1'
  }
]
*/


// 이번에도 같은 쿼리 실행계획
/*
{
    explainVersion: '1',
    queryPlanner: {
      namespace: 'sample_training.zips',
      indexFilterSet: false,
      parsedQuery: {
        '$and': [ { state: { '$eq': 'LA' } }, { pop: { '$gte': 40000 } } ]
      },
      maxIndexedOrSolutionsReached: false,
      maxIndexedAndSolutionsReached: false,
      maxScansToExplodeReached: false,
      winningPlan: {
        stage: 'FETCH',
        inputStage: {
          stage: 'IXSCAN',
          keyPattern: { state: 1, city: 1, pop: 1 },
          indexName: 'state_1_city_1_pop_1',
          isMultiKey: false,
          multiKeyPaths: { state: [], city: [], pop: [] },
          isUnique: false,
          isSparse: false,
          isPartial: false,
          indexVersion: 2,
          direction: 'forward',
          indexBounds: {
            state: [ '["LA", "LA"]' ],
            city: [ '[MinKey, MaxKey]' ],
            pop: [ '[40000, inf.0]' ]
          }
        }
      },
      rejectedPlans: [
        {
          stage: 'SORT',
          sortPattern: { city: 1 },
          memLimit: 33554432,
          type: 'simple',
          inputStage: {
            stage: 'FETCH',
            filter: { pop: { '$gte': 40000 } },
            inputStage: {
              stage: 'IXSCAN',
              keyPattern: { state: 1 },
              indexName: 'state_1',
              isMultiKey: false,
              multiKeyPaths: { state: [] },
              isUnique: false,
              isSparse: false,
              isPartial: false,
              indexVersion: 2,
              direction: 'forward',
              indexBounds: { state: [ '["LA", "LA"]' ] }
            }
          }
        }
      ]
    },
    executionStats: {
      executionSuccess: true,
      nReturned: 13,
      executionTimeMillis: 3,
      totalKeysExamined: 419, // 인덱스키 탐색은 419
      totalDocsExamined: 13, // 탐색 도큐먼트는 13개로 반환갯수와 동일함
      executionStages: {
        stage: 'FETCH', // fetch stage 다음에 sort stage가 없음. 인덱스에 이미 정렬되어있기 때문
        nReturned: 13,
        executionTimeMillisEstimate: 0,
        works: 420,
        advanced: 13,
        needTime: 405,
        needYield: 0,
        saveState: 0,
        restoreState: 0,
        isEOF: 1,
        docsExamined: 13,
        alreadyHasObj: 0,
        inputStage: {
          stage: 'IXSCAN',
          nReturned: 13,
          executionTimeMillisEstimate: 0,
          works: 419,
          advanced: 13,
          needTime: 405,
          needYield: 0,
          saveState: 0,
          restoreState: 0,
          isEOF: 1,
          keyPattern: { state: 1, city: 1, pop: 1 },
          indexName: 'state_1_city_1_pop_1',
          isMultiKey: false,
          multiKeyPaths: { state: [], city: [], pop: [] },
          isUnique: false,
          isSparse: false,
          isPartial: false,
          indexVersion: 2,
          direction: 'forward',
          indexBounds: {
            state: [ '["LA", "LA"]' ],
            city: [ '[MinKey, MaxKey]' ],
            pop: [ '[40000, inf.0]' ]
          },
          keysExamined: 419,
          seeks: 406,
          dupsTested: 0,
          dupsDropped: 0
        }
      }
    },
    command: {
      find: 'zips',
      filter: { state: 'LA', pop: { '$gte': 40000 } },
      sort: { city: 1 },
      '$db': 'sample_training'
    },
    serverInfo: {
      host: 'ac-bocoq0n-shard-00-02.xhpozmz.mongodb.net',
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
      clusterTime: Timestamp({ t: 1678011193, i: 2 }),
      signature: {
        hash: Binary(Buffer.from("3be3c431bbab417e7c5f983d331a466c792cfda7", "hex"), 0),
        keyId: Long("7175942198930702338")
      }
    },
    operationTime: Timestamp({ t: 1678011193, i: 2 })
  }
*/

// 인덱스에 있는 필드만 써서 커버링 인덱스 확인해보기
db.zips.find(
    {
        state: "LA",
        pop: { $gte: 40000 }
    },
    {
        _id: 0,
        state: 1,
        pop: 1,
        city: 1
    }
).sort({city: 1}).explain('executionStats')


/*
{
  explainVersion: '1',
  queryPlanner: {
    namespace: 'sample_training.zips',
    indexFilterSet: false,
    parsedQuery: {
      '$and': [ { state: { '$eq': 'LA' } }, { pop: { '$gte': 40000 } } ]
    },
    maxIndexedOrSolutionsReached: false,
    maxIndexedAndSolutionsReached: false,
    maxScansToExplodeReached: false,
    winningPlan: {
      stage: 'PROJECTION_COVERED',
      transformBy: { _id: 0, state: 1, pop: 1, city: 1 },
      inputStage: {
        stage: 'IXSCAN',
        keyPattern: { state: 1, city: 1, pop: 1 },
        indexName: 'state_1_city_1_pop_1',
        isMultiKey: false,
        multiKeyPaths: { state: [], city: [], pop: [] },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: {
          state: [ '["LA", "LA"]' ],
          city: [ '[MinKey, MaxKey]' ],
          pop: [ '[40000, inf.0]' ]
        }
      }
    },
    rejectedPlans: [
      {
        stage: 'SORT',
        sortPattern: { city: 1 },
        memLimit: 33554432,
        type: 'simple',
        inputStage: {
          stage: 'PROJECTION_SIMPLE',
          transformBy: { _id: 0, state: 1, pop: 1, city: 1 },
          inputStage: {
            stage: 'FETCH',
            filter: { pop: { '$gte': 40000 } },
            inputStage: {
              stage: 'IXSCAN',
              keyPattern: { state: 1 },
              indexName: 'state_1',
              isMultiKey: false,
              multiKeyPaths: { state: [] },
              isUnique: false,
              isSparse: false,
              isPartial: false,
              indexVersion: 2,
              direction: 'forward',
              indexBounds: { state: [ '["LA", "LA"]' ] }
            }
          }
        }
      }
    ]
  },
  executionStats: {
    executionSuccess: true,
    nReturned: 13,
    executionTimeMillis: 2,
    totalKeysExamined: 419, // 키 탐색 419건
    totalDocsExamined: 0, // 도큐먼트 탐색 0건 -> 커버링 인덱스
    executionStages: {
      stage: 'PROJECTION_COVERED', // 커버링 인덱스. fetching 단계 생략
      nReturned: 13,
      executionTimeMillisEstimate: 1,
      works: 420,
      advanced: 13,
      needTime: 405,
      needYield: 0,
      saveState: 0,
      restoreState: 0,
      isEOF: 1,
      transformBy: { _id: 0, state: 1, pop: 1, city: 1 },
      inputStage: {
        stage: 'IXSCAN',
        nReturned: 13,
        executionTimeMillisEstimate: 1,
        works: 420,
        advanced: 13,
        needTime: 405,
        needYield: 0,
        saveState: 0,
        restoreState: 0,
        isEOF: 1,
        keyPattern: { state: 1, city: 1, pop: 1 },
        indexName: 'state_1_city_1_pop_1',
        isMultiKey: false,
        multiKeyPaths: { state: [], city: [], pop: [] },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: {
          state: [ '["LA", "LA"]' ],
          city: [ '[MinKey, MaxKey]' ],
          pop: [ '[40000, inf.0]' ]
        },
        keysExamined: 419,
        seeks: 406,
        dupsTested: 0,
        dupsDropped: 0
      }
    }
  },
  command: {
    find: 'zips',
    filter: { state: 'LA', pop: { '$gte': 40000 } },
    sort: { city: 1 },
    projection: { _id: 0, state: 1, pop: 1, city: 1 },
    '$db': 'sample_training'
  },
  serverInfo: {
    host: 'ac-bocoq0n-shard-00-02.xhpozmz.mongodb.net',
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
    clusterTime: Timestamp({ t: 1678011340, i: 1 }),
    signature: {
      hash: Binary(Buffer.from("743aecee97753ad0415794f97b7b35c16d8e1247", "hex"), 0),
      keyId: Long("7175942198930702338")
    }
  },
  operationTime: Timestamp({ t: 1678011340, i: 1 })
}
*/