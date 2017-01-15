let appConf = require('./conf')
let network = require('./util/network.js')
let Promise = require('./lib/es6-promise.min.js')
const WX_APP_TYPE = 'cloudphotos'
//app.js
App({
    onLaunch: function () {
    },
    getUserAuth: function(cb) {
        let _ = this
        _.getLogin()
            .then(_.getOpenidByCode)
            .then(_.getUserInfo)
            .then(_.getUserBackendResponse)
            .then(function(data) {
                if (data.code == 10000) {
                    typeof cb == "function" && cb()
                } else {
                    console.log('获取用户信息失败！' + res.data.msg)
                }
            })
    },
    getLogin() {
        return new Promise(function(resolve, reject) {
            wx.login({
                success: function (res) {
                    if (res.code){
                        resolve(res.code);
                    } else {
                        reject('获取用户登陆态失败！ ' + res.errMsg);
                    }
                },
                fail: function (res) {
                    console.log('login error')
                }

            })
        });
    },
    getOpenidByCode: function(code) {
        let _ = this
        return new Promise(function(resolve, reject) {

            wx.request({
                url: appConf.domain.api + 'api/wx/user/getOpenidByCode',
                data: {
                    code: code,
                    app: WX_APP_TYPE
                },
                method: 'POST',
                success: function(res) {
                    let loginSucData = res.data;

                    if (loginSucData.code == 10000) {
                        try {
                            wx.setStorageSync('_tjbsid', loginSucData.data._tjbsid)
                        } catch (e) {
                            console.log('get _tjbsid from storage by sync fail')
                        }

                        resolve()
                    } else {
                        console.log('获取openid接口失败！');
                    }
                }
            })
        })
    },
    getUserInfo: function() {

        return new Promise(function(resolve, reject) {
            wx.getUserInfo({
                success: function (res) {
                    resolve(res)

                },
                fail: function (error) {
                    console.log('获取用户信息失败！')
                }
            })
        })
    },
    getUserBackendResponse: function(backendData) {

        return new Promise(function(resolve, reject) {
            network.post(appConf.domain.api + 'api/wx/user/login', {
                    encryptedData: backendData.encryptedData,
                    iv: backendData.iv
                }, function(res) {
                    wx.setStorage({
                        key:"is_manager",
                        data: res.data.data.is_manager
                    })

                    wx.setStorage({
                        key:"unionid",
                        data: res.data.data.unionid
                    })

                    resolve(res.data)
            })
        })
    },
    globalData:{
        userInfo:null
    }
})
