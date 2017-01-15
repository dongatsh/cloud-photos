let appConf = require('../../conf')
let network = require('../../util/network.js')
let app = getApp()
Page({
    data:{
        hasMore: true,
        loading: false,
        newFile: false,
        themeDisabled: '',
        sponsorDisabled: '',
        tjbsid: '',
        isManager: false,

        //相册列表数据
        albumAllList: [],
        albumPackList: [],
        page: 0,
        perNum: 8,

        cssPadding: 'pb0'
    },
    onLoad: function () {
        let _ = this

        wx.getStorage({
            key: '_tjbsid',
            success: function(res) {
                let tjbsid = res.data;
                if (tjbsid) {
                    _.setData({
                        tjbsid: tjbsid
                    });
                    _.getListData()
                } else {
                    //调用应用实例的方法获取全局数据
                    app.getUserAuth(_.getListData)
                }
            },
            fail: function(res) {
                app.getUserAuth(_.getListData)
            }
        })

        wx.getStorage({
            key: 'is_manager',
            success: function(res) {
                let isManager = res.data;

                if (isManager) {
                    _.setData({
                        isManager: isManager,
                        cssPadding: ''
                    });
                }
            }
        })

    },
    loadMore: function(e) {
        let _ = this
        let loadingData = _.data.albumAllList.slice(0, (_.data.page + 1) * _.data.perNum)

        if (!_.data.hasMore) {
            return false
        }

        if (_.data.albumAllList.length > _.data.page * _.data.perNum) {

            _.setData({
                albumPackList: loadingData,
                page: _.data.page + 1
            })
        } else {

            _.setData({
                hasMore: false
            })
        }
    },
    newFileOpt: function(e) {
        let _ = this;
        _.setData({
            newFile:true
        });
    },
    cancelNewFileOpt: function(e) {
        let _ = this;
        _.setData({
            newFile:false
        });
    },
    confirmNewFileOpt: function(e) {
        let _ = this;
        let formData = e.detail.value;
        if ("" == formData.theme) {
            _.setData({
                themeDisabled : 'disabled'
            })
            return false;
        }

        if ("" == formData.sponsor) {
            _.setData({
                sponsorDisabled : 'disabled'
            })
            return false;
        }
        _.setData({
            newFile:false,
            themeDisabled : '',
            sponsorDisabled : ''
        });

        let createAlbumData = {
            'theme': formData.theme,
            'sponsor': formData.sponsor
        }

        network.post(appConf.domain.api + 'api/cloudphotos/create', createAlbumData, function(res) {
            let data = res.data;
            if (data.code == 10000) {
                _.setData({
                    page: 0
                })

                _.getListData()
            }
        })
    },
    submitEnabledOpt: function() {
        this.setData({
            themeDisabled : '',
            sponsorDisabled : ''
        });
    },
    getListData() {
        let _ = this
console.log('get list data')
        network.post(appConf.domain.api + 'api/cloudphotos/albumlist', {}, function(res) {
            let data = res.data;
            if (data.code == 10000) {
                let arr = data.data

                if (arr.length > _.data.perNum) {
                    _.setData({
                        loading: true
                    })
                }
                _.setData({
                    albumAllList: arr,
                    albumPackList: arr.slice(0, (_.data.page + 1) * _.data.perNum),
                    page: _.data.page + 1
                })
            } else if(data.code == 10001) { 
                //认证没有成功
                console.log('认证没有成功')
                app.getUserAuth(_.getListData)
            }
        })

    }
})
