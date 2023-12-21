const bankModel = require('../../models/bank.model')
const utils = require('../../helpers/utils.helper')
const bankHelper = require('../../helpers/bank.helper')
const historyModel = require('../../models/history.model')
const gameHelper = require('../../helpers/game.helper')


function formatToDmy(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}


function validatePhoneNumber(input_str) {
    var re = /^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/;
  
    return re.test(input_str);
  }

function convertPhone(phonenumber) {
    const CELL = {
        '0188': '058',
        '016966': '03966',
        '0169': '039',
        '0168': '038',
        '0167': '037',
        '0166': '036',
        '0165': '035',
        '0164': '034',
        '0163': '033',
        '0162': '032',
        '0120': '070',
        '0121': '079',
        '0122': '077',
        '0126': '076',
        '0128': '078',
        '0123': '083',
        '0124': '084',
        '0125': '085',
        '0127': '081',
        '0129': '082',
        '01999': '059',
        '0186': '056',
    };

    // 1. Xóa khoảng trắng
    phonenumber = phonenumber.replace(/\s/g, '');
    // 2. Xóa các dấu chấm phân cách
    phonenumber = phonenumber.replace(/\./g, '');
    // 3. Xóa các dấu gạch nối phân cách
    phonenumber = phonenumber.replace(/-/g, '');
    // 4. Xóa dấu mở ngoặc đơn
    phonenumber = phonenumber.replace(/\(/g, '');
    // 5. Xóa dấu đóng ngoặc đơn
    phonenumber = phonenumber.replace(/\)/g, '');
    // 6. Xóa dấu +
    phonenumber = phonenumber.replace(/\+/g, '');
    // 7. Chuyển 84 đầu thành 0
    if (phonenumber.substring(0, 2) === '84') {
        phonenumber = '0' + phonenumber.substring(2);
    }

    for (const [key, value] of Object.entries(CELL)) {
        if (phonenumber.indexOf(key) === 0) {
            const prefixlen = key.length;
            const phone = phonenumber.substring(prefixlen);
            const prefix = key.replace(key, value);
            phonenumber = prefix + phone;
            break;
        }
    }

    return phonenumber;
}

const gameController = {
    run: async(req, res, next) => {
        try {

            var game = await gameHelper.game();

            // Lay lich su giao dich
            let data = await bankModel.find({ status: 'active' });

            const currentDate = new Date();

            const toDay = new Date(currentDate);
            toDay.setHours(0, 0, 0, 0);

            const yesterday = new Date(currentDate);
            yesterday.setDate(yesterday.getDate() - 1);

            for (let bank of data) {

                let resultTransaction = await bankHelper.historyMsg(bank.ipAddress, bank.username, bank.password, bank.accountNumber, formatToDmy(yesterday), formatToDmy(toDay));

                // ACB
                if (bank.bankType === 'ACB1') {

                    for (let trans of resultTransaction.data) {
                        if (trans.type === 'OUT') {
                            continue;
                        }

                        var phone = convertPhone(trans.description.split('-')[1]);

                        if (validatePhoneNumber(phone)) {
                            var amount = trans.amount;
                            var description = trans.description;
                            var commentOne = trans.description.split('-')[2];
                            var commentTwo = commentOne.split(' GD ')[0];
                            var transId = trans.description.split('-')[0];

                            // Kiểm tra mã giao dịch
                            if (await historyModel.findOne({ transId: transId })) {
                                continue;
                            }

                            if (commentTwo.toUpperCase() == game[0].comment.tai || commentTwo.toUpperCase() == game[0].comment.xiu) {
                                
                                var gameType = game[0].gameType; // Tro choi

                                if (commentTwo.toUpperCase() == game[0].comment.tai && transId.substr(-1) > 4 && transId.substr(-1) < 9) {

                                    var bonus = amount * game[0].rate.tai; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + commentTwo + ' => Tai thang');
                                } else if (commentTwo.toUpperCase() == game[0].comment.xiu && transId.substr(-1) < 5 && transId.substr(-1) > 0) {

                                    var bonus = amount * game[0].rate.xiu; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + commentTwo + ' => Xiu thang');
                                } else {

                                    var bonus = 0; // Tien nhan
                                    var status = 'lose'; // Trạng thái
                                    var pay = 'success'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + commentTwo + ' => Thua');
                                }
                            }


                            // await new historyModel({
                            //     transId: transId,
                            //     phone: phone,
                            //     comment: commentTwo,
                            //     description: description,
                            //     amount: amount,
                            //     bonus: bonus,
                            //     gameType: gameType,
                            //     status: status,
                            //     find: 0,
                            //     isCheck: 0,
                            //     pay: pay,
                            // }).save();
                        }
                    }
                }

                if(bank.bankType === 'VCB') {

                    if (!resultTransaction.transactions) {
                        await bankModel.findByIdAndUpdate(bank.id, { 
                            $set: 
                                { 
                                    description: resultTransaction.des,
                                    loginStatus: 'errorLogin'
                                } 
                        })

                        continue;
                    }

                    for (let trans of resultTransaction.transactions) {
                        if (trans.CD === '-') {
                            continue;
                        }

                        var phone = convertPhone(trans.Description.split('-')[1]);

                        
                        if (validatePhoneNumber(phone)) {

                            var amount = trans.Amount.replace(/,/g, '');
                            var description = trans.Description;
                            var comment = trans.Description.split('-')[2];
                            var transId = trans.Description.split('.')[3];


                            if (await historyModel.findOne({ transId: transId })) {
                                continue;
                            }

                            // Tro choi tai xiu
                            if (comment.toUpperCase() == game[0].data[0].content || comment.toUpperCase() == game[0].data[1].content) {
                                
                                var gameType = game[0].gameType; // Tro choi

                                if (comment.toUpperCase() == game[0].data[0].content && game[0].data[0].numberTLS.includes(transId.substr(-1))) {

                                    var bonus = amount * game[0].data[0].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[0].name);
                                } else if (comment.toUpperCase() == game[0].data[1].content && game[0].data[1].numberTLS.includes(transId.substr(-1))) {

                                    var bonus = amount * game[0].data[1].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[0].name);
                                } else {

                                    var bonus = 0; // Tien nhan
                                    var status = 'lose'; // Trạng thái
                                    var pay = 'success'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thua | ' + game[0].name);
                                }
                            }

                            // Tro choi tai xiu 2
                            if (comment.toUpperCase() == game[1].data[0].content || comment.toUpperCase() == game[1].data[1].content) {
                                
                                var gameType = game[1].gameType; // Tro choi tai xiu 2

                                if (comment.toUpperCase() == game[1].data[0].content && game[1].data[0].numberTLS.includes(transId.substr(-1))) {

                                    var bonus = amount * game[1].data[0].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[1].name);
                                } else if (comment.toUpperCase() == game[1].data[1].content && game[1].data[1].numberTLS.includes(transId.substr(-1))) {

                                    var bonus = amount * game[1].data[1].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[1].name);
                                } else {

                                    var bonus = 0; // Tien nhan
                                    var status = 'lose'; // Trạng thái
                                    var pay = 'success'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thua | ' + game[1].name);
                                }
                            }

                            // Tro choi chan le
                            if (comment.toUpperCase() == game[2].data[0].content || comment.toUpperCase() == game[2].data[1].content) {
                                
                                var gameType = game[2].gameType; // Tro choi tai xiu 2

                                if (comment.toUpperCase() == game[2].data[0].content && game[2].data[0].numberTLS.includes(transId.substr(-1))) {

                                    var bonus = amount * game[2].data[0].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[2].name);
                                } else if (comment.toUpperCase() == game[2].comment.le && game[2].data[1].numberTLS.includes(transId.substr(-1))) {

                                    var bonus = amount * game[2].data[1].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[2].name);
                                } else {

                                    var bonus = 0; // Tien nhan
                                    var status = 'lose'; // Trạng thái
                                    var pay = 'success'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thua | ' + game[2].name);
                                }
                            }

                            // Tro choi chan le 2
                            if (comment.toUpperCase() == game[3].data[0].content || comment.toUpperCase() == game[3].data[1].content) {
                                
                                var gameType = game[3].gameType; // Tro choi chan le 2

                                if (comment.toUpperCase() == game[3].data[0].content && game[3].data[0].numberTLS.includes(transId.substr(-1))) {

                                    var bonus = amount * game[3].data[0].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[3].name);
                                } else if (comment.toUpperCase() == game[3].data[1].content && game[3].data[1].numberTLS.includes(transId.substr(-1))) {

                                    var bonus = amount * game[3].data[1].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[3].name);
                                } else {

                                    var bonus = 0; // Tien nhan
                                    var status = 'lose'; // Trạng thái
                                    var pay = 'success'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thua | ' + game[3].name);
                                }
                            }

                            // Tro choi 1 phan 3
                            if (comment.toUpperCase() == game[4].data[0].content || comment.toUpperCase() == game[4].data[1].content || comment.toUpperCase() == game[4].data[2].content || comment.toUpperCase() == game[4].data[3].content) {
                                
                                var gameType = game[4].gameType; // Tro choi tai xiu 2

                                if (comment.toUpperCase() == game[4].data[0].content && game[4].data[1].numberTLS.includes(transId.substr(-1))) {

                                    var bonus = amount * game[4].data[1].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[4].name);
                                } else if (comment.toUpperCase() == game[4].data[1].content && game[4].data[2].numberTLS.includes(transId.substr(-1))) {

                                    var bonus = amount * game[4].data[2].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[4].name);

                                } else if (comment.toUpperCase() == game[4].data[2].content && game[4].data[3].numberTLS.includes(transId.substr(-1))) {

                                    var bonus = amount * game[4].data[3].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[4].name);
                                } else if (comment.toUpperCase() == game[4].data[3].content && game[4].data[0].numberTLS.includes(transId.substr(-1))) {

                                    var bonus = amount * game[4].data[0].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[4].name);
                                } else {

                                    var bonus = 0; // Tien nhan
                                    var status = 'lose'; // Trạng thái
                                    var pay = 'success'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thua | ' + game[4].name);
                                }
                            }

                            // Tro choi 1 phan 3
                            if (comment.toUpperCase() == game[4].data[0].content) {
                                
                                var gameType = game[4].gameType; // Tro choi chan le 2

                                const tranOne = transId.substr(-1);
                                const transTwo = transId.substr(-2, 1);
                                const transEnd = transTwo - tranOne;

                                if (comment.toUpperCase() == game[4].data[0].content && game[3].data[0].numberTLS.includes(transEnd)) {

                                    var bonus = amount * game[4].data[0].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[4].name);
                                } else {

                                    var bonus = 0; // Tien nhan
                                    var status = 'lose'; // Trạng thái
                                    var pay = 'success'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thua | ' + game[4].name);
                                }
                            }

                            await new historyModel({
                                transId: transId,
                                phone: phone,
                                comment: comment,
                                description: description,
                                amount: amount,
                                bonus: bonus,
                                gameType: gameType,
                                status: status,
                                find: 0,
                                isCheck: 0,
                                pay: pay,
                            }).save();

                            const io = global.socket;

                            let data = await historyModel.find({ status: 'win' }).select('transId phone amount bonus comment gameType createdAt updatedAt').sort({"_id":-1}).limit(10).lean();
                            io.emit('historyNew', {history: data});
                            
                            
                        }
                    }
                }
                
            }


        } catch(err) {
            console.log(err)
        }
    },
    
}

module.exports = gameController;