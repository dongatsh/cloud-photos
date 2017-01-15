let appConf = require('../../conf')
let network = require('../../util/network.js')
let app = getApp()
Page({
    data:{
        hasMore: true,
        loading: false,
        upToken: '',
        id: '',
        photolist:[],
        tjbsid: '',
        allImgUrls: [],
        firstImgUrls: [],
        elseImgUrls: [],
        page: 0,
        perNum: 18,
        theme: '',
        sponsor: '',
        cssPadding: 'pb0',
        hidden:true
    },
    onLoad: function(params) {
        let _ = this

        _.setData({
            id: params.id
        })

        network.get(appConf.domain.api + 'api/qiniu/upToken', function(res) {
            let data = res.data
            _.setData({
                upToken: data.data.uptoken
            })
        })

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
        let loadingData = _.data.allImgUrls.slice(1, (_.data.page + 1) * _.data.perNum)


        if (!_.data.hasMore) {
            return false
        }

        if (_.data.allImgUrls.length > _.data.page * _.data.perNum) {

            _.setData({
                elseImgUrls: loadingData,
                page: _.data.page + 1
            })
        } else {

            _.setData({
                hasMore: false
            })
        }
    },
    previewOpt: function(e) {
        let imgUrlsArr = []
        for (let item in this.data.allImgUrls) {
            imgUrlsArr.push(this.data.allImgUrls[item].url)
        }

        wx.previewImage({
            current: e.target.dataset.current, // 当前显示图片的http链接
            urls: imgUrlsArr // 需要预览的图片http链接列表
        })
    },
    onShareAppMessage: function () {
        return {
            title: this.data.theme,
            desc: '轻松团建、快乐分享',
            path: '/pages/detail/detail?id=' + this.data.id
        }
    },
    uploadImgOpt: function() {
        let _ = this
        wx.chooseImage({
            count: 9, // 默认9
            sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
            sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
            success: function (res) {
                // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
                let tempFilePaths = res.tempFilePaths
                let len = tempFilePaths.length;

                _.setData({
                    hidden: false
                })

                try {
                    let unionid = wx.getStorageSync('unionid')
                    if (unionid) {
                        _.uploadImgSyn(0, len, tempFilePaths, unionid);
                    } else {
                        _.uploadImgSyn(0, len, tempFilePaths, 'o1GCawZlpGac10S5_u540rbAtIOY');
                    }
                } catch (e) {
                    // Do something when catch error
                } 

             }
        })
    },
    uploadImgSyn: function(index, len, tempFilePaths, unionid) {
        let _ = this

        wx.uploadFile({
            url: 'https://up.qbox.me',
            filePath: tempFilePaths[index],
            name: 'file',
            formData:{
                'token': _.data.upToken,
                'key': 'cloudphotos/' + _.data.id  + '/' + unionid + '/' +  new Date().getTime() + '.' + tempFilePaths[index].split('\.')[1]
            },
            success: function(res){
                let data = JSON.parse(res.data);
                let singleImgInfo = {
                    'url': 'https://img1.iytrip.com/' + data.key,
                    'addtime': new Date().getTime()
                }
                _.data.photolist.push(singleImgInfo);
                if (index + 1 < len) {
                    _.uploadImgSyn(index+1, len, tempFilePaths)
                } else {
                    _.uploadCDNImgUrl(_.data.photolist)

                    _.setData({
                        hidden: true
                    })
                }
            },
            fail (error) {
                console.log(error)
            }
        })
    },
    getListData: function() {
        let _ = this

        network.post(appConf.domain.api + 'api/cloudphotos/albuminfo', {'album_id': _.data.id}, function(res) {
            let data = res.data;
            if (data.code == 10000) {
                let arr = data.data.piclist

                if (arr.length > _.data.perNum) {
                    _.setData({
                        loading: true
                    })
                }
                _.setData({
                    allImgUrls: arr,
                    firstImgUrls: arr.slice(0, 1),
                    elseImgUrls: arr.slice(1, (_.data.page + 1) * _.data.perNum),
                    page: _.data.page + 1,
                    theme: data.data.theme,
                    sponsor: data.data.sponsor
                })

            } else if(data.code == 10001) {
                //认证没有成功
                console.log("认证没有成功")
                app.getUserAuth(_.getListData)
            }
        })
    },
    uploadCDNImgUrl: function(imgUrls) {
        let _ = this
        let CDNImgUrlData = {
            '_id': _.data.id,
            'photolist': imgUrls
        }

        network.post(appConf.domain.api + 'api/cloudphotos/upload', CDNImgUrlData, function(res) {
            let data = res.data;
            if (data.code == 10000) {
                _.getListData()
            } else {
                wx.showToast({
                    title: data.msg,
                    icon: 'success',
                    duration: 2000
                })
            } 
            
        })
    }
})
