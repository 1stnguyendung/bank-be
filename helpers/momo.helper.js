"use strict";
const axios = require('axios');
const { v4: uuidv4 } = require("uuid");
const crypto = require('crypto');
const moment = require('moment');
const { assert } = require('console');
const momoModel = require('../models/momo.model');
const logHelper = require('../helpers/log.helper');
const request = require('request');

const API_KEY = "6b5c02943d6246e9854c52cee641cb2b";

const DEVICE = 'iPhone 13';
const FIRMWARE = '17.0';
const MANUFACTURE = 'Apple';
const CSP = "Viettel";
const APP_VER = 41081;
const APP_CODE = '4.1.8';
const VVERSION = 1004;
const FTV = '1&1&1';

const CHECK_USER_BE_MSG_LINK = 'https://api.momo.vn/backend/auth-app/public/CHECK_USER_BE_MSG';
const SEND_OTP_MSG_LINK = 'https://api.momo.vn/backend/otp-app/public/SEND_OTP_MSG';
const REG_DEVICE_MSG_LINK = 'https://api.momo.vn/backend/otp-app/public/REG_DEVICE_MSG';
const SERVICE_DISPATCHER_LINK = 'https://api.momo.vn/bank/service-dispatcher';
const BROWSE_TRANSACTION = 'https://api.momo.vn/transhis/api/transhis/browse';
const LIST_TRANSACTION = 'https://api.momo.vn/transhis/api/transhis/list';
const DETAIL_TRANSACTION = 'https://api.momo.vn/transhis/api/transhis/detail';
const LOGIN_MSG_LINK = 'https://owa.momo.vn/public/login';
const GENERATE_TOKEN_AUTH_MSG = 'https://api.momo.vn/auth/fast-login/refresh-token';

const checkSum = (phone, type, times, setupKey) => encryptString(`${phone}${times}000000${type}${times / 1000000000000.0}E12`, setupKey)


const encryptRSA = (data, publicKey) => crypto.publicEncrypt({
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_PADDING,
}, Buffer.from(data)).toString("base64");

const doRequestEncryptWithVSign = async(
    account,
    requestEncryptKey,
    targetLink,
    body,
    msgType,
) => {
    const adjustBody = {
        ...body,
    };

    const requestSecretKey = crypto.randomBytes(32).toString("hex").substring(32);
    const requestKey = encryptRSA(requestSecretKey, requestEncryptKey);


    const encryptedRequestString = encryptString(
        JSON.stringify(adjustBody),
        requestSecretKey,
    );

    const vsign = await this.getVSignEncrypted(encryptedRequestString);
    if (!vsign) {
        throw new Error('Có lỗi khi lấy vsign' + targetLink);
    }

    return await axios
        .post(
            targetLink,
            encryptedRequestString, {
                headers: {
                    msgtype: msgType,
                    app_code: APP_CODE,
                    'user-agent': `MoMoPlatform Store/${APP_VER}.${APP_CODE} CFNetwork/1335.0.3.4 Darwin/21.6.0 (${DEVICE} iOS/${FIRMWARE}) AgentID/${account.agentId}`,
                    app_version: APP_VER,
                    lang: 'vi',
                    channel: 'APP',
                    vversion: VVERSION,
                    ftv: FTV,
                    vsign,
                    env: 'production',
                    timezone: 'Asia/Ho_Chi_Minh',
                    'accept-language': 'vi-VN,vi;q=0.9',
                    device_os: 'IOS',
                    'accept-charset': 'UTF-8',
                    sessionkey: account.sessionKey,
                    'requestkey': requestKey,
                    userid: account.phone,
                    user_phone: account.phone,
                    tbid: account.tbid,
                    agent_id: parseInt(account.agentId),
                    'http-process-timestamp': Date.now(),
                    'momo-session-key-tracking': account.sessionKeyTracking,
                    Authorization: `Bearer ${account.authToken}`,
                },
                timeout: 15000,
            },
            account.phone,
        )
        .then((data) => {
            const decryptedResponseData = decryptString(
                data.data,
                requestSecretKey,
            );
            return JSON.parse(decryptedResponseData);
        })
        .catch((error) => {
            console.log(error)
            if (error && error.response && error.response.status === 401) {
                // not logined
                console.log('account not logined');
            } else {
                console.error('[momo] do nothing');
            }
        });
}

const decryptString = (data, key) => {
    let iv = Buffer.alloc(16);
    let cipher = crypto.createDecipheriv("aes-256-cbc", key.substring(0, 32), iv);
    return cipher.update(data, "base64") + cipher.final("utf8");
}

// hàm encrypt
const encryptString = (data, key) => {
    let iv = Buffer.alloc(16);
    let cipher = crypto.createCipheriv("aes-256-cbc", key.substr(0, 32), iv);
    return Buffer.concat([cipher.update(data, "utf8"), cipher.final()]).toString("base64");
}

exports.randomMemoList = () => {
    let defaultMemoList = [
        { "categoryId": 16, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "☕️ Chuyển tiền cà phê", "categoryName": "Cà phê, đồ uống khác" },
        { "categoryId": 16, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "🥤 Chuyển tiền trà sữa", "ranking": -1, "categoryName": "Cà phê, đồ uống khác" },
        { "categoryId": 5, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "🍛 Chuyển tiền ăn trưa", "ranking": 30, categoryName: "Ăn uống" },
        { "categoryId": 5, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "🍲 Chuyển tiền ăn tối", "ranking": -1, categoryName: "Ăn uống" },
        { "categoryId": 5, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "🍜 Chuyển tiền ăn sáng", "ranking": -1, categoryName: "Ăn uống" },
        { "categoryId": 14, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "💰 Trả nợ nha!", "ranking": 20, categoryName: "Trả nợ" },
        { "categoryId": 10, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "🏠 Chuyển tiền nhà trọ", "ranking": -1, categoryName: "Sinh hoạt phí" },
        { "categoryId": 10, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "💡 Chuyển tiền điện", "ranking": -1, categoryName: "Sinh hoạt phí" },
        { "categoryId": 10, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "💦 Tiền nước sinh hoạt", "ranking": -1, categoryName: "Sinh hoạt phí" },
        { "categoryId": 10, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "🌐 Chuyển tiền internet", "ranking": -1, categoryName: "Sinh hoạt phí" },
        { "categoryId": 66, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "💸 Tiền tiêu vặt", "ranking": 40, categoryName: "Gửi tiền người thân" },
        { "categoryId": 66, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "💵 Chuyển tiền cho ba mẹ", "ranking": -1, categoryName: "Gửi tiền người thân" },
        { "categoryId": 67, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "🤑 Cho bạn mượn tiền", "ranking": -1, categoryName: "Cho vay" },
        { "categoryId": 67, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "💲 Chuyển tiền cho vay", "ranking": -1, categoryName: "Cho vay" },
        { "categoryId": 78, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "📦 Trả tiền hàng", "ranking": -1, categoryName: "Mua sắm" },
        { "categoryId": 78, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "🛍️ Mình thanh toán nhé", "ranking": -1, categoryName: "Mua sắm" },
        { "categoryId": 78, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "🚚 Chuyển tiền shipper", "ranking": -1, categoryName: "Mua sắm" },
        { "categoryId": 13, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "🎦 Chuyển tiền xem phim", "ranking": -1, categoryName: "Giải trí" },
        { "categoryId": 13, "themeId": 261, themeUrl: "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png", "message": "🧳 Chuyển tiền du lịch", "ranking": -1, categoryName: "Giải trí" },
    ]
    return defaultMemoList[Math.floor(Math.random() * listDevice.length)];
}

exports.randomCharacter = (length) => {
    let result = '';
    const characters = 'ABCDEFabcdef0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

const commonHeader = {
    app_code: APP_CODE,
    'user-agent': `MoMoPlatform Store/${APP_VER}.${APP_CODE} CFNetwork/1335.0.3.4 Darwin/21.6.0 (${DEVICE} iOS/${FIRMWARE}) AgentID/0`,
    app_version: APP_VER,
    lang: 'vi',
    channel: 'APP',
    env: 'production',
    timezone: 'Asia/Ho_Chi_Minh',
    'accept-language': 'vi-VN,vi;q=0.9',
    device_os: 'IOS',
    'accept-charset': 'UTF-8',
    accept: 'application/json',
    agent_id: 0,
    vversion: VVERSION,
    ftv: FTV,
    'content-type': 'application/json',
}


exports.getVsign = async(data) => {
    try {
        const { data: result } = await axios.post('https://vsign.pro/api/v2/getVSign', data, {
            headers: {
                key: API_KEY,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.31',
                os: 'ios',
                version: '4.1.8'
            },
            timeout: 10000,
        });
        return result && result.data;
    } catch (e) {
        console.log(e);
        console.log('Có lỗi khi lấy vSIGN');
        return ''
    }
}

exports.getVSignEncrypted = async(string) => {
    try {
        const { data: result } = await axios.post('https://vsign.pro/api/v2/getVSign', { encrypted: string }, {
            headers: {
                key: API_KEY,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.31',
                os: 'ios',
                version: '4.1.8'
            },
            timeout: 10000,
        });
        return result && result.data;
    } catch (e) {
        console.log('Có lỗi khi lấy vSIGN');
        return ''
    }
}

exports.checkUserBeMsg = async(phone) => {
    try {
        const randomImei = uuidv4().toUpperCase();

        const tbid = this.randomCharacter(40).toUpperCase();
        const sessionKeyTracking = uuidv4().toUpperCase();

        const time = Date.now();
        // momo data cần gửi
        const momoData = {
                "user": phone,
                "msgType": "CHECK_USER_BE_MSG",
                "momoMsg": {
                    "_class": "mservice.backend.entity.msg.RegDeviceMsg",
                    "number": phone,
                    "imei": randomImei,
                    "cname": "Vietnam",
                    "ccode": "084",
                    "device": DEVICE,
                    "firmware": FIRMWARE,
                    "hardware": "iPhone",
                    "manufacture": MANUFACTURE,
                    "csp": CSP,
                    "icc": "",
                    "mcc": "452",
                    "mnc": "04",
                    "device_os": "ios",
                    "secure_id": "",
                },
                "appVer": APP_VER,
                "appCode": APP_CODE,
                "lang": "vi",
                "deviceOS": "ios",
                "channel": "APP",
                "buildNumber": 0,
                "appId": "vn.momo.platform",
                "cmdId": `${time}000000`,
                "time": time,
            }
            // console.log('BODY cần lấy vsign', momoData);
        const vsign = await this.getVsign(momoData);
        // console.log('VSign là', vsign);
        if (!vsign) {
            // Trường hợp không lấy được vsign
            return {
                message: 'Có lỗi khi lấy vSign CHECK_USER_BE_MSG',
            }
        }


        const headers = {
                sessionkey: '',
                userid: '',
                msgtype: 'CHECK_USER_BE_MSG',
                user_phone: '',
                vsign: vsign,
                tbid: tbid,
                'platform-timestamp': Date.now(),
                'momo-session-key-tracking': sessionKeyTracking,
                ...commonHeader,
            }
            // console.log('Header là', headers);

        const { data: resultMoMo } = await axios.post(CHECK_USER_BE_MSG_LINK, momoData, {
            headers,
        });
        if (resultMoMo.result && resultMoMo.errorCode === 0) {
            // Lưu các biến tbid, sessionKeyTracking, randomImei, DEVICE, CSP vào cơ sở dữ liệu, ở demo này sẽ trả kết quả để thực hiện các API phía sau.
            // console.log(resultMoMo);
            return ({
                dataDevice: {
                    DEVICE: 'iPhone 13',
                    FIRMWARE: '17.0',
                    MANUFACTURE: 'Apple',
                    CSP: "Viettel",
                },
                tbid,
                sessionKeyTracking,
                imei: randomImei,
            })

        }

    } catch (e) {
        console.log('Có lỗi xảy ra khi gọi API momo CHECK_USER_BE_MSG');
        return {}
    }

}

exports.sendOTPMsg = async(phone, tbid, sessionKeyTracking, imei) => {
    try {
        const time = Date.now();
        const rKey = this.randomCharacter(20);
        const modelId = this.randomCharacter(64).toLowerCase();
        const deviceToken = this.randomCharacter(64).toUpperCase();
        // momo data cần gửi
        const momoData = {
                "user": phone,
                "msgType": "SEND_OTP_MSG",
                "momoMsg": {
                    "_class": "mservice.backend.entity.msg.RegDeviceMsg",
                    "number": phone,
                    "imei": imei,
                    "cname": "Vietnam",
                    "ccode": "084",
                    "device": DEVICE,
                    "firmware": FIRMWARE,
                    "hardware": "iPhone",
                    "manufacture": MANUFACTURE,
                    "csp": CSP,
                    "icc": "",
                    "mnc": "04",
                    "mcc": "452",
                    "device_os": "ios",
                    "secure_id": "",
                },
                "extra": {
                    "action": "SEND",
                    "rkey": rKey,
                    "IDFA": "",
                    "SIMULATOR": false,
                    "TOKEN": "",
                    "ONESIGNAL_TOKEN": "",
                    "SECUREID": "",
                    "MODELID": modelId,
                    "DEVICE_TOKEN": deviceToken,
                    "isVoice": true,
                    "OTP_TYPE": "",
                    "REQUIRE_HASH_STRING_OTP": true,
                },
                "appVer": APP_VER,
                "appCode": APP_CODE,
                "lang": "vi",
                "deviceOS": "ios",
                "channel": "APP",
                "buildNumber": 0,
                "appId": "vn.momo.platform",
                "cmdId": `${time}000000`,
                "time": time,
            }
            // console.log('BODY cần lấy vsign', momoData);
        const vsign = await this.getVsign(momoData);
        // console.log('VSign là', vsign);
        if (!vsign) {
            // Trường hợp không lấy được vsign
            return {
                message: 'Có lỗi khi lấy vSign SEND_OTP_MSG',
            }
        }
        // Trường hợp có vsign tiến hành gửi đến api momo


        const headers = {
                sessionkey: '',
                userid: '',
                msgtype: 'SEND_OTP_MSG',
                user_phone: '',
                vsign: vsign,
                tbid: tbid,
                'platform-timestamp': Date.now(),
                'momo-session-key-tracking': sessionKeyTracking,
                ...commonHeader,
            }
            // console.log('Header là', headers);
            // momoData cần phải minify trước khi gửi lên momo, ở đây dùng trick JSON.parse(JSON.stringify(momoData))
        const { data: resultMoMo } = await axios.post(SEND_OTP_MSG_LINK, momoData, {
            headers,

        });
        // Trường hợp momo phản hồi thành công
        if (resultMoMo.result && resultMoMo.errorCode === 0) {
            // Lưu các biến rKey, modelId, deviceToken vào cơ sở dữ liệu, ở demo này sẽ trả kết quả để thực hiện các API phía sau.
            // console.log(resultMoMo);
            return {
                rKey,
                modelId,
                deviceToken,
            }

        } else {
            return { message: resultMoMo.errorDesc }
        }


    } catch (e) {
        console.log('Có lỗi xảy ra khi gọi API momo SEND_OTP_MSG');
        return {}
    }
}

exports.regDeviceMsg = async(phone, password, otp, tbid, sessionKeyTracking, imei, rKey, modelId, deviceToken) => {
    try {
        const time = Date.now();
        const oHash = crypto.createHash("sha256").update(`${phone}${rKey}${otp}`).digest("hex");

        // momo data cần gửi
        const momoData = {
                "user": phone,
                "msgType": "REG_DEVICE_MSG",
                "momoMsg": {
                    "_class": "mservice.backend.entity.msg.RegDeviceMsg",
                    "number": phone,
                    "imei": imei,
                    "cname": "Vietnam",
                    "ccode": "084",
                    "device": DEVICE,
                    "firmware": FIRMWARE,
                    "hardware": "iPhone",
                    "manufacture": "Apple",
                    "csp": CSP,
                    "icc": "",
                    "mcc": "452",
                    "mnc": "04",
                    "device_os": "ios",
                    "secure_id": "",
                },
                "extra": {
                    "ohash": oHash,
                    "IDFA": "",
                    "SIMULATOR": false,
                    "TOKEN": "",
                    "ONESIGNAL_TOKEN": "",
                    "SECUREID": "",
                    "MODELID": modelId,
                    "DEVICE_TOKEN": deviceToken,
                    "isAllowNoti": "true",
                },
                "appVer": APP_VER,
                "appCode": APP_CODE,
                "lang": "vi",
                "deviceOS": "ios",
                "channel": "APP",
                "buildNumber": 0,
                "appId": "vn.momo.platform",
                "cmdId": `${time}000000`,
                "time": time,
            }
            // console.log('BODY cần lấy vsign', momoData);
        const vsign = await this.getVsign(momoData);
        // console.log('VSign là', vsign);
        if (!vsign) {
            // Trường hợp không lấy được vsign
            return {
                message: 'Có lỗi khi lấy vSign REG_DEVICE_MSG',
            }
        }
        // Trường hợp có vsign tiến hành gửi đến api momo


        const headers = {
                sessionkey: '',
                userid: '',
                msgtype: 'REG_DEVICE_MSG',
                user_phone: '',
                vsign: vsign,
                tbid: tbid,
                'platform-timestamp': Date.now(),
                'momo-session-key-tracking': sessionKeyTracking,
                ...commonHeader,
            }
            // console.log('Header là', headers);
            // momoData cần phải minify trước khi gửi lên momo, ở đây dùng trick JSON.parse(JSON.stringify(momoData))
        const { data: resultMoMo } = await axios.post(REG_DEVICE_MSG_LINK, momoData, {
            headers,

        });


        // Trường hợp momo phản hồi thành công
        if (resultMoMo.result && resultMoMo.errorCode === 0) {

            console.log(resultMoMo);

            const setupKey = decryptString(resultMoMo.extra.setupKey, resultMoMo.extra.ohash);
            const pHash = encryptString(`${imei}|${password}`, setupKey);
            const name = resultMoMo.extra.NAME;
            // Lưu các biến pHash, setupKey, name vào DB ở đây chỉ return lại kết quả

            return {
                pHash,
                setupKey,
                name,
            }

        } else {
            console.log('Momo lỗi', resultMoMo.errorDesc)
            return {
                message: resultMoMo.errorDesc,
            }
        }


    } catch (e) {
        console.log('Có lỗi xảy ra khi gọi API momo REG_DEVICE_MSG');
        return {}
    }

}

exports.loginMsg = async(phone, pass, pHash, modelId, deviceToken, setupKey) => {
    const time = Date.now();

    const checkSumCalculated = checkSum(phone, 'USER_LOGIN_MSG', time, setupKey)

    const bodyLogin = {
        "user": phone,
        "pass": pass,
        "msgType": "USER_LOGIN_MSG",
        "momoMsg": {
            "_class": "mservice.backend.entity.msg.LoginMsg",
            "isSetup": false,
        },
        "extra": {
            "pHash": pHash,
            "IDFA": "",
            "SIMULATOR": false,
            "TOKEN": "",
            "ONESIGNAL_TOKEN": "",
            "SECUREID": "",
            "MODELID": modelId,
            "DEVICE_TOKEN": deviceToken,
            "checkSum": checkSumCalculated,
        },
        "appVer": APP_VER,
        "appCode": APP_CODE,
        "lang": "vi",
        "deviceOS": "ios",
        "channel": "APP",
        "buildNumber": 0,
        "appId": "vn.momo.platform",
        "cmdId": `${time}000000`,
        "time": time,
    }

    const headers = {
        ...commonHeader,
        sessionkey: '',
        userid: phone,
        msgtype: 'USER_LOGIN_MSG',
        user_phone: phone,
        agent_id: 0,
        authorization: 'Bearer'
    }
    

    const { data: result } = await axios.post(LOGIN_MSG_LINK, bodyLogin, {
        headers,
    });


    if (result.errorCode === 0) {
        console.log('Login momo thành công');
        const accessToken = result.extra.AUTH_TOKEN;
        const sessionKey = result.extra.SESSION_KEY;
        const agentId = result.momoMsg.agentId;
        const requestEncryptKey = result.extra.REQUEST_ENCRYPT_KEY;
        const REFRESH_TOKEN = result.extra.REFRESH_TOKEN;
        const balance = result.extra.BALANCE;
        return { accessToken, sessionKey, agentId, requestEncryptKey, balance, REFRESH_TOKEN };
    }

}

exports.browseTransactions = async(phone, accessToken, agentId, sessionKey, tbid, sessionKeyTracking, START_DATE, END_DATE, requestEncryptKey) => {
    try {

        const body = {
            requestId: Date.now(),
            startDate: START_DATE,
            endDate: END_DATE,
            offset: 0,
            limit: 20,
            appCode: APP_CODE,
            appVer: APP_VER,
            lang: 'vi',
            deviceOS: 'IOS',
            channel: 'APP',
            buildNumber: 9832,
            appId: 'vn.momo.transactionhistory',
        }

        const result = await doRequestEncryptWithVSign({
            phone,
            authToken: accessToken,
            sessionKey,
            tbid,
            agentId,
            sessionKeyTracking
        }, requestEncryptKey, BROWSE_TRANSACTION, body, 'browse');

        console.log(result);


        console.log('Result browse', result.momoMsg.filter(a => a.io === 1 && a.status === 2 && a.errorCode === 0));

        // kiểm tra và lọc các giao dịch trong start_Date và end_date;
        const startDateInTimeStamp = moment(START_DATE, 'DD/MM/YYYY').startOf('date').valueOf();
        const endDateInTimeStamp = moment(END_DATE, 'DD/MM/YYYY').endOf('date').valueOf();
        console.log(startDateInTimeStamp, endDateInTimeStamp);

        const filteredTransactions = result.momoMsg.filter(a => a.lastUpdate &&
            a.lastUpdate >= startDateInTimeStamp &&
            a.lastUpdate <= endDateInTimeStamp && a.io === 1 && a.status === 2 && a.errorCode === 0);

        console.log('filtered momo transaction using BROWSE', filteredTransactions);
        return filteredTransactions; // ở đây có thể check io === 1 để tìm giao dịch nhận tiền
    } catch (e) {
        console.log(e);
        return {}
    }

}

exports.sendMoneyMsg = async(phone, password, accessToken, agentId, sessionKey, tbid, sessionKeyTracking, setupKey, requestEncryptKey, receiver, amount, memo) => {
    const time = Date.now();
    const checkSumCalculated = checkSum(phone, 'M2MU_INIT', time, setupKey);
    const clientTime = Date.now();
  
    const bodyInit = {
      "appCode": APP_CODE,
      "appId": "vn.momo.payment",
      "appVer": APP_VER,
      "buildNumber": 3437,
      "channel": "APP",
      "cmdId": `${time}000000`,
      "time": time,
      "deviceOS": "ios",
      "errorCode": 0,
      "errorDesc": "",
      "extra": {
        "checkSum": checkSumCalculated
      },
      "lang": "vi",
      "user": phone,
      "msgType": "M2MU_INIT",
      "momoMsg": {
        "tranType": 2018,
        "tranList": [{
          "themeUrl": "https://img.mservice.com.vn/app/img/transfer/theme/trasua-750x260.png",
          "stickers": "",
          "partnerName": "Tran Van An",
          "serviceId": "transfer_p2p",
          "originalAmount": amount,
          "receiverType": 1,
          "partnerId": receiver,
          "serviceCode": "transfer_p2p",
          "_class": "mservice.backend.entity.msg.M2MUInitMsg",
          "tranType": 2018,
          "comment": memo,
          "moneySource": 1,
          "partnerCode": "momo",
          "rowCardId": null,
          "sourceToken": "SOF-1",
          "extras": "{\"avatarUrl\":\"\",\"aliasName\":\"\",\"appSendChat\":false,\"stickers\":\"\",\"themeId\":261,\"source\":\"search_p2p\",\"expenseCategory\":\"66\",\"categoryName\":\"Gửi tiền người thân\",\"agentId\":"+`${agentId}`+",\"bankCustomerId\":\"\"}"
        }],
        "clientTime": clientTime,
        "serviceId": "transfer_p2p",
        "_class": "mservice.backend.entity.msg.M2MUInitMsg",
        "defaultMoneySource": 1,
        "sourceToken": "SOF-1",
        "giftId": "",
        "useVoucher": 0,
        "discountCode": null,
        "prepaidIds": "",
        "usePrepaid": 0
      },
      "pass": ""
    }
  
    const initResponse = await doRequestEncryptWithVSign({
      phone, authToken: accessToken, sessionKey, tbid, agentId, sessionKeyTracking
    }, requestEncryptKey, 'https://owa.momo.vn/api/M2MU_INIT', bodyInit, 'M2MU_INIT');


    if(!initResponse) {
        return ({
            type: 'errorDesc',
            result: false,
            message: 'Không thể chuyển tiền'
        })
    }
  
  
    if (initResponse.result) {
      // xác thực giao dịch CK
  
      const checkSofInfo = JSON.parse(initResponse.extra.sofInfo);
      const momoWalletInfo = checkSofInfo.find(a => a.moneySource === 1);
      if (momoWalletInfo.balance < amount) {
        console.log('Không đủ số dư để CK MOMO')
        return ({
            type: 'minMoney',
            result: false,
            message: 'Không đủ số dư ví để CK MOMO'
        })
      }
      const time1 = Date.now();
      const checkSumCalculated = checkSum(phone, 'M2MU_CONFIRM', time1, setupKey);
      const idTransaction = initResponse.momoMsg.replyMsgs[0].id;
      const tranHisMsg = initResponse.momoMsg.replyMsgs[0].tranHisMsg;
  
      const bodyConfirm = {
        user: phone,
        msgType: 'M2MU_CONFIRM',
        pass: password,
        cmdId: `${time1}000000`,
        lang: 'vi',
        time: time1,
        channel: 'APP',
        appVer: APP_VER,
        appCode: APP_CODE,
        deviceOS: 'ios',
        result: true,
        errorCode: 0,
        errorDesc: '',
        momoMsg: {
          otpType: 'NA',
          ipAddress: 'N/A',
          _class: 'mservice.backend.entity.msg.M2MUConfirmMsg',
          quantity: 1,
          idFirstReplyMsg: idTransaction,
          moneySource: 1,
          tranHisMsgs: [tranHisMsg],
          tranType: 2018,
          ids: [idTransaction],
          amount,
          originalAmount: amount,
          fee: 0,
          feeCashIn: 0,
          feeMoMo: 0,
          cashInAmount: amount,
          otp: '',
          extras: '{}',
        },
        extra: {
          checkSum: checkSumCalculated
        },
      };
    
      const confirmResponse = await doRequestEncryptWithVSign({
        phone, authToken: accessToken, sessionKey, tbid, agentId, sessionKeyTracking,
      }, requestEncryptKey, 'https://owa.momo.vn/api/M2MU_CONFIRM', bodyConfirm, 'M2MU_CONFIRM');
  
      return confirmResponse;
  
    } else {
        console.log('Khỏi tạo ck momo bị lỗi', initResponse.errorDesc);
        return ({
            type: 'errorDesc',
            result: false,
            message: initResponse.errorDesc
        })
    }
  
  
}

exports.refreshToken = async (phone) => {
    try {
        const dataPhone = await momoModel.findOne({ phone, REFRESH_TOKEN: { $exists: true } });

        if (!dataPhone) {
            return ({
                success: false,
                phone,
                message: 'Không tìm thấy dữ liệu số điện thoại này hoặc lỗi',
            })
        }

        const dataDevice = dataPhone.dataDevice;
        let times = new Date().getTime();

        let options = {
            method: 'POST',
            url: GENERATE_TOKEN_AUTH_MSG,
            headers: {
                'userid': phone,
                'Authorization': 'Bearer ' + dataPhone.REFRESH_TOKEN,
                'msgtype': 'REFRESH_TOKEN_MSG',
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                user: phone,
                msgType: "REFRESH_TOKEN_MSG",
                cmdId: times + "000000",
                lang: "vi",
                time: times,
                channel: "APP",
                appVer: APP_VER,
                appCode: APP_CODE,
                deviceOS: 'ios',
                buildNumber: 0,
                appId: "vn.momo.platform",
                result: true,
                errorCode: 0,
                errorDesc: "",
                momoMsg: {
                    _class: "mservice.backend.entity.msg.RefreshAccessTokenMsg",
                    accessToken: dataPhone.AUTH_TOKEN
                },
                extra: {
                    AAID: dataPhone.AAID,
                    IDFA: "",
                    TOKEN: dataPhone.TOKEN,
                    ONESIGNAL_TOKEN: "",
                    SIMULATOR: "",
                    MODELID: dataDevice.MODELID,
                    DEVICE_TOKEN: "",
                    checkSum: checkSum(phone, 'GENERATE_TOKEN_AUTH_MSG', times, dataPhone.setupKey)
                }
            })
        };

        let { data: response } = await axios(options);

        if (!response.momoMsg.accessToken) {
            await momoModel.findOneAndUpdate({ phone }, { $set: { loginStatus: 'waitLogin' } }, { upsert: true })
            let reLogin = await this.loginMsg(phone);

            return reLogin.success ? ({
                success: true,
                phone,
                message: 'Đăng nhập lại thành công!',
                data: await momoModel.findOne({ phone })
            }) : reLogin
        }

        let AUTH_TOKEN = response.momoMsg.accessToken;
        console.log(AUTH_TOKEN);

        await momoModel.findOneAndUpdate({ phone }, { $set: { AUTH_TOKEN, loginAt: new Date(), loginStatus: 'active' } }, { upsert: true });

        return ({
            success: true,
            phone,
            message: 'refreshToken thành công!',
            data: await momoModel.findOne({ phone })
        });

    } catch (err) {
        await momoModel.findOneAndUpdate({ phone }, { $set: { loginStatus: 'refreshError', description: 'Có lỗi xảy ra ' + err.message || err } }, { upsert: true })
        await logHelper.create('refreshToken', `refreshToken thất bại!\n* [ ${phone} ]\n* [ Có lỗi xảy ra ${err.message || err} ]`);
        return ({
            success: false,
            phone,
            message: 'Có lỗi xảy ra ' + err.message || err,
        });
    }
}

exports.checkName = async (phone, receiver) => {
    try {
        const times = new Date().getTime();
        const checkSession = await this.checkSession(phone);

        if (!checkSession.success) {
            return checkSession;
        }

        const dataPhone = checkSession.data;
        const dataDevice = dataPhone.dataDevice;
        let key = crypto.randomBytes(32).toString("hex").substring(32), requestkey = this.encryptRSA(key, dataPhone.REQUEST_ENCRYPT_KEY);

        let options = {
            method: 'POST',
            url: 'https://owa.momo.vn/api/CHECK_USER_PRIVATE',
            headers: {
                'requestkey': requestkey,
                'userid': phone,
                'msgtype': 'CHECK_USER_PRIVATE',
                'Authorization': 'Bearer ' + dataPhone.AUTH_TOKEN,
                'Content-Type': 'application/json'
            },
            body: this.encryptString(JSON.stringify({
                user: phone,
                msgType: "CHECK_USER_PRIVATE",
                cmdId: times + "000000",
                lang: "vi",
                time: times,
                channel: "APP",
                appVer: APP_VER,
                appCode: APP_CODE,
                deviceOS: 'ios',
                buildNumber: 1916,
                appId: "vn.momo.transfer",
                result: true,
                errorCode: 0,
                errorDesc: "",
                momoMsg:
                {
                    _class: "mservice.backend.entity.msg.LoginMsg",
                    getMutualFriend: false
                },
                extra:
                {
                    CHECK_INFO_NUMBER: receiver,
                    checkSum: checkSum(phone, "CHECK_USER_PRIVATE", times, dataPhone.setupKey)
                }
            }), key)
        };

        return new Promise((resolve, reject) => {
            request(options, async (err, response, body) => {
                try {
                    body = JSON.parse(this.decryptString(body, key));
                    return body.result ? resolve({
                        success: true,
                        message: 'Lấy thành công!',
                        name: body.extra.NAME
                    }) : resolve({
                        success: false,
                        message: body.errorDesc
                    })
                } catch (err) {
                    return resolve({
                        success: false,
                        message: 'Có lỗi xảy ra ' + err.message || err
                    })
                }
            })
        })
    } catch (err) {
        await momoModel.findOneAndUpdate({ phone }, { $set: { description: 'CHECK_USER_PRIVATE| Có lỗi xảy ra ' + err.message || err } })
        return ({
            success: false,
            message: 'Có lỗi xảy ra ' + err.message || err
        })
    }
}

exports.checkSession = async (phone, refresh = false) => {
    const dataPhone = await momoModel.findOne({ phone, AUTH_TOKEN: { $exists: true } });

    return dataPhone;
}

exports.getBalance = async (phone) => {
    let times = new Date().getTime();
    const checkSession = await this.checkSession(phone);

    const dataPhone = checkSession;

    const dataDevice = dataPhone.dataDevice;
    let key = crypto.randomBytes(32).toString("hex").substring(32), requestkey = encryptRSA(key, dataPhone.requestEncryptKey);

    let options = {
        method: 'POST',
        url: 'https://api.momo.vn/sof/default-money/api',
       headers: {
            'requestkey': requestkey,
            'userid': phone,
            'msgtype': 'SOF_GET_DEFAULT_MONEY',
            'Authorization': 'Bearer ' + dataPhone.AUTH_TOKEN,
           'Content-Type': 'application/json'
        },
        body: encryptString(JSON.stringify({
            user: phone,
           msgType: "SOF_GET_DEFAULT_MONEY",
            cmdId: times + "000000",
            lang: "vi",
            time: times,
            channel: "APP",
            appVer: APP_VER,
            appCode: APP_CODE,
            deviceOS: 'ios',
            buildNumber: 428,
            appId: "vn.momo.sof",
            result: true,
          errorCode: 0,
            errorDesc: "",
           momoMsg: {
                _class: "mservice.backend.entity.msg.ForwardMsg"
            },
            extra: {
                checkSum: checkSum(phone, "SOF_GET_DEFAULT_MONEY", times, dataPhone.setupKey)
            }
        }), key)
    };


    return new Promise((resolve, reject) => {
        request(options, async (err, response, body) => {
            try {
                body = JSON.parse(decryptString(body, key));
                return body.result ? await momoModel.findOneAndUpdate({ phone }, { $set: { amount: body.momoMsg.sofInfo[0].balance } }, { upsert: true }) && resolve({
                    success: true,
                    message: 'Lấy thành công!',
                    balance: body.momoMsg.sofInfo[0].balance
                }) : resolve({
                    success: false,
                    message: body.errorDesc
                })
          } catch (err) {
                await momoModel.findOneAndUpdate({ phone }, { $set: { description: 'SOF_GET_DEFAULT_MONEY| Có lỗi xảy ra ' + err.message || err } })
                return resolve({
                    success: false,
                    message: 'Có lỗi xảy ra ' + err
                })
            }
       })
   })
}