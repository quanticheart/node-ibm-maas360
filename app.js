const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const methods = require('./service.js');

// create application/x-www-form-urlencoded parser 
const urlencodedParser = bodyParser.urlencoded({
    extended: false
});

app.set('view engine', 'ejs');

//Request constiables
let authToken;

const loginData = {
    uri: "",
    billingID: "",
    platformID: "",
    appID: "",
    appVersion: "",
    appAccessKey: "",
    userName: "",
    password: ""
}

let selectedUser = {};
let selectedDevice = {};

app.get('/', function (req, res) {
    console.log(req.query)
    res.render('index')
});

app.get('/index', function (req, res) {
    console.log(req.query)
    res.render('index');
});

app.get('/monitoring', function (req, res) {
    methods.data.getDevices(authToken, loginData)
        .then(function (devicesArray) {
            devicesArray.forEach(function (deviceItem) {
                methods.data.getcellularData(authToken, loginData, deviceItem.maas360DeviceID)
                    .then(function (cellularData) {

                        const currentDate = new Date();
                        const itemDate = new Date(cellularData.loctime);
                        const cellularDataArray = [];

                        if (currentDate.getHours() < itemDate.getHours() || String(cellularData.status) === "No") {
                            cellularData.user = deviceItem.username;
                            cellularDataArray.push(cellularData);

                        }
                        console.log("Device Item: ", cellularDataArray[0])

                        res.render('monitoring', {
                            cellularDataArray: cellularDataArray,
                        })
                    });
            });
        });
});

app.get('/users', function (req, res) {
    methods.data.getUsers(authToken, loginData)
        .then(function (userArray) {
            res.render('users', {
                userArray: userArray,
                selectedUser: selectedUser
            })
        });
});

app.get('/devices', function (req, res) {
    methods.data.getDevices(authToken, loginData)
        .then(function (devicesArray) {

            const cellularData = {};
            const appArray = [];

            res.render('devices', {
                deviceArray: devicesArray,
                selectedDevice: selectedDevice,
                cellularData: cellularData,
                appArray: appArray,
            });
        });
});

app.post('/index', urlencodedParser, function (req, res) {
    res.render('index')
});

app.post('/monitoring', urlencodedParser, function (req, res) {
    loginData.uri = req.body.host;
    loginData.billingID = req.body.billingID; //"30081687",//billingID,
    loginData.platformID = req.body.platformID; //"3",//platformID,
    loginData.appID = req.body.appID; //"com.30081687.api",//appID,
    loginData.appVersion = req.body.appVersion; //"1.0",//appVersion,
    loginData.appAccessKey = req.body.appAccessKey; //"7I6067cMtT",//appAccessKey,
    loginData.userName = req.body.userName; //userName,
    loginData.password = req.body.password; //password    

    methods.data.getAuthToken(loginData)
        .then(function (result) {
            authToken = result;

            methods.data.getDevices(authToken, loginData)
                .then(function (devicesArray) {
                    devicesArray.forEach(function (deviceItem) {
                        methods.data.getcellularData(authToken, loginData, deviceItem.maas360DeviceID)
                            .then(function (cellularData) {

                                const currentDate = new Date();
                                const itemDate = new Date(cellularData.loctime);
                                const cellularDataArray = [];

                                if (currentDate.getHours() < itemDate.getHours() || String(cellularData.status) === "No") {
                                    cellularData.user = deviceItem.username;
                                    cellularDataArray.push(cellularData);

                                }
                                console.log("Device Item: ", cellularDataArray[0])

                                res.render('monitoring', {
                                    cellularDataArray: cellularDataArray,
                                })
                            });
                    });
                });
        });
});

app.post('/users', urlencodedParser, function (req, res) {

    methods.data.getUsers(authToken, loginData)
        .then(function (userArray) {
            userArray.forEach(function (index) {
                if (String(index.Name) === String(req.body.user)) {
                    selectedUser = index;
                }
            });

            console.log("selected User ", selectedUser);

            res.render('users', {
                userArray: userArray,
                selectedUser: selectedUser
            });
        });
});

app.post('/devices', urlencodedParser, function (req, res) {
    methods.data.getDevices(authToken, loginData)
        .then(function (devicesArray) {

            devicesArray.forEach(function (index) {
                if (String(index.maas360DeviceID) === String(req.body.device)) {
                    selectedDevice = index;
                }
            });

            if (selectedDevice === "- Devices -") {

                const appArray = [];

                res.render('devices', {
                    deviceArray: devicesArray,
                    selectedDevice: selectedDevice,
                    cellularData: cellularData,
                    appArray: appArray
                });
            }

            methods.data.getcellularData(authToken, loginData, req.body.device)
                .then(function (cellularData) {
                    methods.data.getDeviceSoftware(authToken, loginData, req.body.device)
                        .then(function (appArray) {
                            res.render('devices', {
                                deviceArray: devicesArray,
                                selectedDevice: selectedDevice,
                                cellularData: cellularData,
                                appArray: appArray,
                            });
                        });
                });
        });
});

app.listen(3000);
