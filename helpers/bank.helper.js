"use strict";
const axios = require('axios');


exports.getOtpMsg = async(ip_address, username, passowrd, accountNumber) => {

    const vcbData = {
        "action": "get_otp",
        "username": username,
        "password": passowrd,
        "accountNumber": accountNumber
    }

    const headers = {
        'Content-Type': 'application/json'
    }

    const { data: resultVcb } = await axios.post(ip_address, vcbData, {
        headers,
    });

    return resultVcb
}

exports.importOtpMsg = async(ip_address, username, password, accountNumber, otp) => {

    const vcbData = {
        "action": "import_otp",
        "username": username,
        "password": password,
        "accountNumber": accountNumber,
        "otp": otp
    }

    const headers = {
        'Content-Type': 'application/json'
    }

    const { data: resultVcb } = await axios.post(ip_address, vcbData, {
        headers,
    });

    return resultVcb
}

exports.historyMsg = async(ip_address, username, password, accountNumber, begin, end) => {
    
    const bankData = {
        "action": "transactions",
        "username": username,
        "password": password,
        "accountNumber": accountNumber,
        "begin": begin,
        "end": end
    }

    const headers = {
        'Content-Type': 'application/json'
    }

    const { data: resultVcb } = await axios.post(ip_address, bankData, {
        headers,
    });

    return resultVcb
}

exports.getBalanceMsg = async(ip_address, username, password, accountNumber) => {
    const bankData = {
        "rows": 10,
        "action": "balance",
        "username": username,
        "password": password,
        "accountNumber": accountNumber
    }

    const headers = {
        'Content-Type': 'application/json'
    }

    const { data: resultBank } = await axios.post(ip_address, bankData, {
        headers,
    });
    // console.log(resultBank);
    return resultBank
}