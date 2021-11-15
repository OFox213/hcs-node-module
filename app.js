const hcs = require('./src');
const bodyParser = require('body-parser');
const HttpsProxyAgent = require('https-proxy-agent');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
const it = readline[Symbol.asyncIterator]();
const express = require('express');
const app = express();
const agent = new HttpsProxyAgent("HTTP PROXY 필요");


const fetch = require('node-fetch');
const { response } = require('express');

hcs.setAgent(agent);

String.prototype.string = function (len) { var s = '', i = 0; while (i++ < len) { s += this; } return s; };
String.prototype.zf = function (len) { return "0".string(len - this.length) + this; };
Number.prototype.zf = function (len) { return this.toString().zf(len); };

var testProxyServer = async() => {
    const res = await fetch("https://example.com/", {
        method: 'GET',
        agent: agent,
        timeout: 5000
    }).catch(error => {
        let today = new Date();

        let year = today.getFullYear();
        let month = today.getMonth() + 1;
        let date = today.getDate().zf(2);
        let hours = today.getHours().zf(2);
        let minutes = today.getMinutes();
        let seconds = today.getSeconds().zf(2);
    
        console.log(`${year}-${month}-${date} ${hours}:${minutes}:${seconds} 프록시 서버 연결 실패 | ${error}`);
    });
    if(res != null){
        return "ok";
    } else {
        return "error";
    }
}

function getTime() {
    let today = new Date();

    let year = today.getFullYear();
    let month = today.getMonth() + 1;
    let date = today.getDate().zf(2);
    let hours = today.getHours().zf(2);
    let minutes = today.getMinutes().zf(2);
    let seconds = today.getSeconds().zf(2);
    return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`
}

var checkStart = async  (name, birth, password, schoolName, schoolLevel, schoolRegion, index) => {
    console.log(`${getTime()} ${name} 자가진단 시작`)
    const schools = await hcs.searchSchool(schoolName, schoolLevel, schoolRegion)
    if (schools.length === 0) {
        console.log(`${getTime()} ${name} 검색된 학교가 없습니다.`)
        return JSON.stringify({"isError":true, "code":"SCHOOL_NOT_FOUND", message:"검색된 학교가 없습니다."});
    }
    const school = schools[index]
    if(!school){
        return JSON.stringify({"isError":true, "code":"SCHOOL_INDEX_NOTFOUND", message:"학교가 검색되었으나 Index 값이 잘못되었습니다."});
    }

    const login = await hcs.login(school.endpoint, school.schoolCode, name, birth)
    if (!login.success) {
        console.log(`${getTime()} ${name} 로그인에 실패했습니다. | ${birth} ${password} ${schoolName} ${schoolRegion} ${index}`)
        return JSON.stringify({"isError":true, "code":"LOGIN_FAILED", message:"로그인할 수 없습니다."});
    }
    if (login.agreementRequired) {
        console.log(`${getTime()} ${name} 개인정보 처리 방침 (https://hcs.eduro.go.kr/agreement) 에 동의함`)
        await hcs.updateAgreement(school.endpoint, login.token)
    }

    const passwordExists = await hcs.passwordExists(school.endpoint, login.token)
    if (!passwordExists) {
        return JSON.stringify({"isError":true, "code":"HCS_PASSWORD_NOTSET", message:"자가진단 비밀번호가 설정되어있지 않음"});
    }

    let token // 비밀번호로 로그인하여 새로운 토큰을 받아옵니다.
    while (true) {
        const secondLogin = await hcs.secondLogin(school.endpoint, login.token, password)
        if (secondLogin.success) {
            token = secondLogin.token
            break
        }
        if (secondLogin.message) {
            console.log(secondLogin.message)
            return JSON.stringify({"isError":true, "code":"LOGIN_SECOND", message:secondLogin.message});
        }
        if (secondLogin.remainingMinutes) {
            console.log(`${getTime()} ${name}  5회 이상 실패하여 ${secondLogin.remainingMinutes}분 후에 재시도가 가능합니다.`)
            return JSON.stringify({"isError":true, "code":"PASSWORD_ERROR", message:`5회 이상 실패하여 ${secondLogin.remainingMinutes}분 후에 재시도가 가능합니다.`});
        }
        console.log(`${getTime()} ${name} 잘못된 비밀번호입니다. 현재 ${secondLogin.failCount}번 실패하셨습니다.`)
        return JSON.stringify({"isError":true, "code":"PASSWORD_ERROR", message:`잘못된 비밀번호입니다. 5회 이상 실패시 5분 후에 재시도가 가능합니다.\n현재 ${secondLogin.failCount}번 실패하셨습니다.`});
    }

    const survey = {
        Q1: false,
        Q2: false,
        Q3: false,
    }
    const result = await hcs.registerSurvey(school.endpoint, token, survey)
    console.log(`${result.registeredAt} ${login.name}님 자가진단 완료`)
    return JSON.stringify({"isError":false, "code":"SUCCESS", message:`자가진단을 완료하였습니다`});
}

app.use('/check', function(req, res){
    
    var name= req.query.name;
    var birth= req.query.birth;
    var password= req.query.password;
    var school= req.query.schoolName;
    var schoolLevel= req.query.schoolLevel;
    var schoolRegion= req.query.schoolRegion;
    var index= req.query.index;
    
    if(name && birth && password && school && schoolLevel && schoolRegion && index){
        checkStart(name, birth, password, school, schoolLevel, schoolRegion, index)
        .then(function(value){ res.send(value)
            res.end();});
    } else {
        res.statusCode = 412
        res.send(JSON.stringify({"isError":true, "code":"REQUEST_ERROR", message:`요청한 값이 잘못되었습니다`}))
        res.end();
    }

});

app.use('/test', function(req, res){
    testProxyServer().then(function(value){
        res.send(value);
    res.end(); });
});
app.listen(5555, function(){
    console.log("HCS Server(v0.1) has started : port 5555")
});
