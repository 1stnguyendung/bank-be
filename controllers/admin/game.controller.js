const bankModel = require('../../models/bank.model')
const utils = require('../../helpers/utils.helper')
const bankHelper = require('../../helpers/bank.helper')
const historyModel = require('../../models/history.model')
const gameHelper = require('../../helpers/game.helper')
const momoService = require('../../services/momo.service');
const momoModel = require('../../models/momo.model')
const momoHelper = require('../../helpers/momo.helper')
const settingModel = require('../../models/setting.model')
const transferModel = require('../../models/transfer.model')
const commentHelper = require('../../helpers/comment.helper')
const logHelper = require('../../helpers/log.helper')
const revenueService = require('../../services/revenue.service');
const eventModel = require('../../models/event.model')

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
                                    var status = 'won'; // Trạng thái
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

                        if (!trans.Description.split('-')[1]) {
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
                                var gameName = game[0].name;

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
                                    var status = 'won'; // Trạng thái
                                    var pay = 'success'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thua | ' + game[0].name);
                                }
                            }

                            // Tro choi tai xiu 2
                            if (comment.toUpperCase() == game[1].data[0].content || comment.toUpperCase() == game[1].data[1].content) {
                                
                                var gameType = game[1].gameType; // Tro choi tai xiu 2
                                var gameName = game[1].name;

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
                                    var status = 'won'; // Trạng thái
                                    var pay = 'success'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thua | ' + game[1].name);
                                }
                            }

                            // Tro choi chan le
                            if (comment.toUpperCase() == game[2].data[0].content || comment.toUpperCase() == game[2].data[1].content) {
                                
                                var gameType = game[2].gameType; // Tro choi tai xiu 2
                                var gameName = game[2].name;

                                if (comment.toUpperCase() == game[2].data[0].content && game[2].data[0].numberTLS.includes(transId.substr(-1))) {

                                    var bonus = amount * game[2].data[0].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[2].name);
                                } else if (comment.toUpperCase() == game[2].data[1].content && game[2].data[1].numberTLS.includes(transId.substr(-1))) {

                                    var bonus = amount * game[2].data[1].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[2].name);
                                } else {

                                    var bonus = 0; // Tien nhan
                                    var status = 'won'; // Trạng thái
                                    var pay = 'success'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thua | ' + game[2].name);
                                }
                            }

                            // Tro choi chan le 2
                            if (comment.toUpperCase() == game[3].data[0].content || comment.toUpperCase() == game[3].data[1].content) {
                                
                                var gameType = game[3].gameType; // Tro choi chan le 2
                                var gameName = game[3].name;

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
                                    var status = 'won'; // Trạng thái
                                    var pay = 'success'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thua | ' + game[3].name);
                                }
                            }

                            // Tro choi 1 phan 3
                            if (comment.toUpperCase() == game[4].data[0].content || comment.toUpperCase() == game[4].data[1].content || comment.toUpperCase() == game[4].data[2].content || comment.toUpperCase() == game[4].data[3].content) {
                                
                                var gameType = game[4].gameType; // Tro choi tai xiu 2
                                var gameName = game[4].name;

                                if (comment.toUpperCase() == game[4].data[1].content && game[4].data[1].numberTLS.includes(transId.substr(-1))) {

                                    var bonus = amount * game[4].data[1].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[4].name);
                                } else if (comment.toUpperCase() == game[4].data[2].content && game[4].data[2].numberTLS.includes(transId.substr(-1))) {

                                    var bonus = amount * game[4].data[2].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[4].name);

                                } else if (comment.toUpperCase() == game[4].data[3].content && game[4].data[3].numberTLS.includes(transId.substr(-1))) {

                                    var bonus = amount * game[4].data[3].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[4].name);
                                } else if (comment.toUpperCase() == game[4].data[0].content && game[4].data[0].numberTLS.includes(transId.substr(-1))) {

                                    var bonus = amount * game[4].data[0].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[4].name);
                                } else {

                                    var bonus = 0; // Tien nhan
                                    var status = 'won'; // Trạng thái
                                    var pay = 'success'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thua | ' + game[4].name);
                                }
                            }

                            // Tro choi H3
                            if (comment.toUpperCase() == game[5].data[0].content) {
                                
                                var gameType = game[5].gameType; // Tro choi 1 phan 3
                                var gameName = game[5].name;

                                const tranOne = transId.substr(-1);
                                const transTwo = transId.substr(-2, 1);
                                const transEnd = transTwo - tranOne;
                                if (comment.toUpperCase() == game[5].data[0].content && transEnd === 3) {
                                    var bonus = amount * game[5].data[0].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[5].name);
                                } else if (comment.toUpperCase() == game[5].data[1].content && transEnd === 5) {
                                    var bonus = amount * game[5].data[1].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[5].name);
                                } else if (comment.toUpperCase() == game[5].data[2].content && transEnd === 7) {
                                    var bonus = amount * game[5].data[2].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[5].name);
                                } else if (comment.toUpperCase() == game[5].data[3].content && transEnd === 9) {
                                    var bonus = amount * game[5].data[3].amount; // Tien nhan
                                    var status = 'win'; // Trạng thái
                                    var pay = 'wait'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thắng | ' + game[5].name);
                                } else {

                                    var bonus = 0; // Tien nhan
                                    var status = 'won'; // Trạng thái
                                    var pay = 'success'; // Trạng thái trả tiền

                                    console.log(transId + ' - ' + comment + ' => Thua | ' + game[5].name);
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
                                gameName: gameName,
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

    bill: async(req, res, next) => {
        try {
            let histories = await historyModel.find({ status: 'win', pay: 'wait' }).select('transId phone amount bonus comment gameType createdAt updatedAt').sort({"_id":-1}).limit(10).lean();

            let dataSetting = await settingModel.findOne();
    
            for (let history of histories) {

                let phoneData = await momoModel.aggregate([
                    {
                        $match: {
                            status: 'active',
                            loginStatus: 'active',
                            amount: { $gte: history.bonus }
                        }
                    },
                    {
                        $sample: { size: 1 }
                    }
                ]);
    
                let momoData = phoneData[0];

                if (!momoData) {
                    console.log('Không tìm thấy số cho #'+ history.transId);
                    continue;
                }

                // Tuy chỉnh memo
                let commentData = [
                    {
                        name: 'transId',
                        value: history.transId,
                    },
                    {
                        name: 'comment',
                        value: history.comment,
                    },
                    {
                        name: 'amount',
                        value: history.amount,
                    },
                    {
                        name: 'bonus',
                        value: history.bonus,
                    }
                ];

                let receiver = history.phone;
                let amount = history.bonus;
                let memo = await commentHelper.dataComment(dataSetting.commentSite.rewardGD, commentData);

                //Kiểm tra đã trả thưởng hay chưa
                if (await transferModel.findOne({ receiver: history.partnerId, amount: history.bonus, comment: memo })) {
                    console.log(`#${history.transId} đã được trả thưởng trước đó, bỏ qua!`);
                    await historyModel.findOneAndUpdate({ transId }, 
                        { $set: 
                            { 
                                pay: 'success',
                                targetId: momoData.phone,
                                partnerId: receiver 
                            } 
                        });
                    return;
                }
    
                // Thực hiện chuyển tiền
                var resultSendMoney = await momoHelper.sendMoneyMsg(momoData.phone, momoData.password, momoData.AUTH_TOKEN, momoData.agentId, momoData.sessionKey, momoData.tbid, momoData.sessionKeyTracking, momoData.setupKey, momoData.requestEncryptKey, receiver, amount, memo)
    
                if (!resultSendMoney) {
                    await eventModel.findByIdAndUpdate(history._id, { $set: { status: 'win', pay: 'error' } });
                    await logHelper.create('rewardTransId', `Trả thưởng thất bại!\n* [ ${history.phone} | ${history.transId} ]\n* [ Số ${momoData.phone} đã hết thời gian truy cập! ]`);
                    continue;
                }

                if (resultSendMoney.result === true) {
                    await new transferModel({ 
                        transId: resultSendMoney.momoMsg.replyMsgs[0].transId, 
                        phone: momoData.phone,
                        receiver: receiver, 
                        firstMoney: momoData.amount, 
                        lastMoney: (momoData.amount - amount), 
                        amount: amount, 
                        comment: memo 
                    }).save();
    
                    console.log('Chuyển tiền đến ' + momoData.phone + ' thành công. (#' + resultSendMoney.momoMsg.replyMsgs[0].transId + ') Người nhận ' + resultSendMoney.momoMsg.replyMsgs[0].tranHisMsg.partnerName);
    
                    // Cập nhật trạng thái chuyển tiền
                    await historyModel.findByIdAndUpdate(history._id, 
                        { $set: 
                            { 
                                pay: 'success',
                                targetId: momoData.phone,
                                partnerId: receiver,
                                partnerName: resultSendMoney.momoMsg.replyMsgs[0].tranHisMsg.partnerName
                            } 
                        });


                    // Cập nhật số dư momo
                    await momoModel.findByIdAndUpdate(momoData._id, 
                        { $set: 
                            { 
                                amount: momoData.amount - amount,
                            } 
                        });
                    
                        await logHelper.create('rewardTransId', `Trả thưởng thành công!\n* [ ${receiver} | ${history.transId} ]`);

                        continue;

                } else {
                    if(resultSendMoney.type === 'minMoney') {
                        await eventModel.findByIdAndUpdate(history._id, { $set: { status: 'win', pay: 'error' } });
                        await logHelper.create('rewardTransId', `Trả thưởng thất bại!\n* [ ${history.phone} | ${history.transId} ]\n* [ Số ${momoData.phone} đã hết tiền hệ thống đang chuyển số ]`);
                        continue;
                    }

                    if(resultSendMoney.type === 'errorDesc') {
                        await eventModel.findByIdAndUpdate(history._id, { $set: { status: 'win', pay: 'error' } });
                        await logHelper.create('rewardTransId', `Trả thưởng thất bại!\n* [ ${history.phone} | ${history.transId} ]\n* [ Số ${momoData.phone} ${resultSendMoney.message} ]`);
                        continue;
                    }
                }
            }
        } catch(e) {
            console.log(e);
        }
    },

    checkMax: async() => {
        try {
            
            const revenueData = await revenueService.revenueMoney('2023-12-22', 'day', '');

            console.log(revenueData);
            
        } catch (err) {
            console.log(err);
            return ({
                success: false,
                message: `Có lỗi xảy ra ${err.message || err}`
            })
        }
    },

    event: async() => {
        try { 
            let histories = await eventModel.find({ status: 'wait' }).sort({"_id":-1}).limit(10).lean();

            let dataSetting = await settingModel.findOne();

            for(let history of histories) {

                let phoneData = await momoModel.aggregate([
                    {
                        $match: {
                            status: 'active',
                            // loginStatus: 'active',
                            amount: { $gte: history.bonus }
                        }
                    },
                    {
                        $sample: { size: 1 }
                    }
                ]);

                if (!phoneData) {
                    console.log('Không tìm thấy số cho #', history.transId);
                    return;
                }

                // Thiet lap chuyen tien
                let momoData = phoneData[0];
                let receiver = history.phone;
                let amount = history.bonus;

                let commentData = [
                    {
                        name: 'phone',
                        value: history.phone,
                    },
                    {
                        name: 'amount',
                        value: history.amount,
                    },
                    {
                        name: 'bonus',
                        value: history.bonus,
                    }
                ];

                let memo = await commentHelper.dataComment(dataSetting.commentSite.rewardMission, commentData);

                var resultSendMoney = await momoHelper.sendMoneyMsg(momoData.phone, momoData.password, momoData.AUTH_TOKEN, momoData.agentId, momoData.sessionKey, momoData.tbid, momoData.sessionKeyTracking, momoData.setupKey, momoData.requestEncryptKey, receiver, amount, memo)

                if (!resultSendMoney) {
                    await eventModel.findByIdAndUpdate(history._id, { $set: { status: 'error'} });
                    await logHelper.create('rewardMission', `Trả thưởng thất bại!\n* [ ${history.phone} | ${history.bonus} ]\n* [ Số ${momoData.phone} đã hết thời gian truy cập! ]`);
                    continue;
                }

                if (resultSendMoney.result === true) {
                    await new transferModel({ 
                        transId: resultSendMoney.momoMsg.replyMsgs[0].transId, 
                        phone: momoData.phone,
                        receiver: receiver, 
                        firstMoney: momoData.amount, 
                        lastMoney: (momoData.amount - amount), 
                        amount: amount, 
                        comment: memo 
                    }).save();

                    var desc = '(Mission) Chuyển tiền đến ' + momoData.phone + ' thành công. (#' + resultSendMoney.momoMsg.replyMsgs[0].transId + ') Người nhận ' + resultSendMoney.momoMsg.replyMsgs[0].tranHisMsg.partnerName;
                    console.log(desc);

                    // Cập nhật trạng thái chuyển tiền
                    await eventModel.findByIdAndUpdate(history._id, { $set: { status: 'success', description: desc  } });


                    // Cập nhật số dư momo
                    await momoModel.findByIdAndUpdate(momoData._id, { $set: { amount: momoData.amount - amount } });
                    
                    await logHelper.create('rewardMission', `Trả thưởng thành công!\n* [ ${history.phone} | ${history.bonus} ]`);
                    
                    continue;

                } else {
                    if(resultSendMoney.type === 'minMoney') {
                        await eventModel.findByIdAndUpdate(history._id, { $set: { status: 'error'} });
                        await logHelper.create('rewardMission', `Trả thưởng thất bại!\n* [ ${history.phone} | ${history.bonus} ]\n* [ Số ${momoData.phone} đã hết tiền hệ thống đang chuyển số ]`);
                        continue;
                    }

                    if(resultSendMoney.type === 'errorDesc') {
                        await eventModel.findByIdAndUpdate(history._id, { $set: { status: 'error'} });
                        await logHelper.create('rewardMission', `Trả thưởng thất bại!\n* [ ${history.phone} | ${history.bonus} ]\n* [ Số ${momoData.phone} ${resultSendMoney.message} ]`);
                        continue;
                    }
                }
            }
        }catch(e) {
            console.log(e);
        }
    }
    
}

module.exports = gameController;