// 강사님 의식의 흐름대로 짠 쿼리를 인덱스로 튜닝해보기

// use sample_analytics

// account에 대해서 symbol로 grouping
// 회사 거래 별 누적 수량
// 그 중에서 상위 3개
// msft에 대한 값만 추출
// customer 정보와 account 정보도 함께 출력

db.transactions.aggregate([
    {
        $unwind: "$transactions"
    },
    {
        $group: {
            _id: {
                account_id: "$account_id",
                symbol: "$transactions.symbol"
            },
            currentHolding: {
                $sum: {
                    $cond: [
                        {
                            $eq: [
                                '$transactions.transaction_code',
                                'buy'
                            ]
                        },
                        '$transactions.ammount',
                        {
                            $multiply: [
                                '$transactions.amount',
                                -1
                            ]
                        }
                    ]
                }
            }
        }
    },
    {
        $match: {
            '_id.symbol': 'msft'
        }
    },
    {
        $lookup: {
            from: 'accounts',
            localField: '_id.account_id',
            foreignField: 'account_id',
            as: 'account_info',
            pipeline: [
                {
                    $lookup: {
                        from: 'customers',
                        localField: 'account_id',
                        foreignField: 'accounts',
                        as: 'customer_info',
                        pipeline: [
                            {
                                $project: {
                                    username: 1,
                                    _id: 0
                                }
                            }
                        ]
                    }
                },
                {
                    $project: {
                        _id: 0,
                        account_id: 0
                    }
                },
                {
                    $unwind: '$customer_info'
                }
            ]
        }
    },
    {
        $unwind: '$account_info'
    },
    {
        $project: {
            _id: 0,
            user: "$account_info.customer_info.username",
            account_id: '$_id.account_id',
            symbol: '$_id.symbol',
            currentHolding: 1,
            account_info: {
                limit: 1,
                products: 1
            }
        }
    },
    {
        $sort: {
            currentHolding: -1
        }
    },
    {
        $limit: 3
    }
]).explain('executionStats')

/*

lookup쪽 실행계획
      totalDocsExamined: Long("1127492"),
      totalKeysExamined: Long("0"),
      collectionScans: Long("2008"),
      indexesUsed: [],
      nReturned: Long("503"),
      executionTimeMillisEstimate: Long("959")


문제점
- 503개의 도큐먼트를 반환하기 위해 1,127,492개의 도큐먼트를 조회함. 비효율적

*/

// 쿼리 최적화
db.transactions.aggregate([
    {
        $unwind: "$transactions"
    },
    {
        $group: {
            _id: {
                account_id: "$account_id",
                symbol: "$transactions.symbol"
            },
            currentHolding: {
                $sum: {
                    $cond: [
                        {
                            $eq: [
                                '$transactions.transaction_code',
                                'buy'
                            ]
                        },
                        '$transactions.ammount',
                        {
                            $multiply: [
                                '$transactions.amount',
                                -1
                            ]
                        }
                    ]
                }
            }
        }
    },
    {
        $match: {
            '_id.symbol': 'msft'
        }
    },
    {
        $sort: {
            currentHolding: -1
        }
    },
    {
        $limit: 3 // sorting, limit을 lookup 전에 실행하여 쿼리 최적화
    },
    {
        $lookup: {
            from: 'accounts',
            localField: '_id.account_id',
            foreignField: 'account_id',
            as: 'account_info',
            pipeline: [
                {
                    $lookup: {
                        from: 'customers',
                        localField: 'account_id',
                        foreignField: 'accounts',
                        as: 'customer_info',
                        pipeline: [
                            {
                                $project: {
                                    username: 1,
                                    _id: 0
                                }
                            }
                        ]
                    }
                },
                {
                    $project: {
                        _id: 0,
                        account_id: 0
                    }
                },
                {
                    $unwind: '$customer_info'
                }
            ]
        }
    },
    {
        $unwind: '$account_info'
    },
    {
        $project: {
            _id: 0,
            user: "$account_info.customer_info.username",
            account_id: '$_id.account_id',
            symbol: '$_id.symbol',
            currentHolding: 1,
            account_info: {
                limit: 1,
                products: 1
            }
        }
    }
]).explain('executionStats')

/*
lookup쪽 실행계획
totalDocsExamined: Long("4492"),
      totalKeysExamined: Long("0"),
      collectionScans: Long("8"),
      indexesUsed: [],
      nReturned: Long("3"),
      executionTimeMillisEstimate: Long("172")

개선점
- totalDocsExamineted : 1127492 -> 4492
- nReturned : 503 -> 3
- executionTimeMillisEstimate : 959 -> 172
*/