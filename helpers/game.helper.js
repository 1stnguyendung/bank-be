
const gameHelper = {

    game: async() => {
        let game = [
            { 
                id: 1, 
                name: 'Tài xỉu', 
                gameType: 'taixiu',
                rate: Math.floor(Math.random() * 99999999), 
                data: [{
                    "name": "Tài",
                    "content": "T",
                    "numberTLS": [
                        "5",
                        "6",
                        "7",
                        "8"
                    ],
                    "amount": 2.6,
                },
                {
                    "name": "Xỉu",
                    "content": "X",
                    "numberTLS": [
                        "1",
                        "2",
                        "3",
                        "4"
                    ],
                    "amount": 2.6,
                }]
            },
            { 
                id: 2, 
                name: 'Tài xỉu 2', 
                gameType: 'taixiu2',
                rate: Math.floor(Math.random() * 99999999), 
                data: [{
                    "name": "Tài",
                    "content": "T2",
                    "numberTLS": [
                        "5",
                        "6",
                        "7",
                        "8",
                        "9"
                    ],
                    "amount": 1.9,
                },
                {
                    "name": "Xỉu",
                    "content": "X2",
                    "numberTLS": [
                        "0",
                        "1",
                        "2",
                        "3",
                        "4"
                    ],
                    "amount": 1.9,
                }]
            },
            { 
                id: 3, 
                name: 'Chẵn lẻ', 
                gameType: 'chanle',
                rate: Math.floor(Math.random() * 99999999), 
                data: [{
                    "name": "Chẵn",
                    "content": "C",
                    "numberTLS": [
                        "2",
                        "4",
                        "6",
                        "8"
                    ],
                    "amount": 2.6,
                },
                {
                    "name": "Lẻ",
                    "content": "L",
                    "numberTLS": [
                        "1",
                        "3",
                        "5",
                        "7"
                    ],
                    "amount": 2.6,
                }]
            },
            { 
                id: 4, 
                name: 'Chẵn lẻ 2', 
                gameType: 'chanle2',
                rate: Math.floor(Math.random() * 99999999), 
                data: [{
                    "name": "Chẵn",
                    "content": "C2",
                    "numberTLS": [
                        "0",
                        "2",
                        "4",
                        "6",
                        "8"
                    ],
                    "amount": 2.6,
                },
                {
                    "name": "Lẻ",
                    "content": "L2",
                    "numberTLS": [
                        "1",
                        "3",
                        "5",
                        "7",
                        "9"
                    ],
                    "amount": 2.6,
                }]
            },
            { 
                id: 5, 
                name: '1 Phần 3', 
                gameType: 'phan3',
                rate: Math.floor(Math.random() * 99999999), 
                data: [{
                    "name": "N0",
                    "content": "N0",
                    "numberTLS": [
                        "0",
                    ],
                    "amount": 6,
                },
                {
                    "name": "N1",
                    "content": "N1",
                    "numberTLS": [
                        "1",
                        "2",
                        "3",
                    ],
                    "amount": 3,
                },
                {
                    "name": "N2",
                    "content": "N2",
                    "numberTLS": [
                        "4",
                        "5",
                        "6",
                    ],
                    "amount": 3,
                },
                {
                    "name": "N3",
                    "content": "N3",
                    "numberTLS": [
                        "7",
                        "8",
                        "9",
                    ],
                    "amount": 3,
                }]
            },
            { 
                id: 6, 
                name: 'H3', 
                gameType: 'h3',
                rate: Math.floor(Math.random() * 99999999), 
                data: [{
                    "name": "H3",
                    "content": "H3",
                    "numberTLS": [
                        "3",
                        "5",
                        "7",
                        "9"
                    ],
                    "amount": 3,
                }]
            },
        ];
        return game
    },
}

module.exports = gameHelper;