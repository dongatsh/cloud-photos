let appConf = require('../../conf')

let network = require('../../util/network')

let app = getApp()

Page({
	data: {
		hidden: false,
		isEmtpy: false,
		loading: false,
		refresh: false,
		upToken: '',
		id: '',
		photolist: [],
		tjbsid: '',
		allImgUrls: [],
		elseImgUrls: [],
		page: 0,
		perNum: 18,
		theme: '',
		sponsor: '',
		cssPadding: 'pb0',
		moveLeft: false,
		focus: false,
		participatorlist: [],
		participatorlistCount: 0,
		pictureNum: 0,
		isAlbumAdmin: false,
		unionid: '',
		isThemeEdit: false,
		uploadPrivilege: 0,
		addtime: ''
	},
	onLoad: function (params) {
		let _ = this

		_.setData({
			id: params.id
		})
		console.log('onload')
		_.getTjbsidFromStorage()
	},
	onShow: function () {
		this.getQiniuToken()
	},
	getQiniuToken: function () {
		let _ = this
		network.get(`${appConf.domain.api}api/qiniu/upToken`, (res) => {
			let data = res.data
			_.setData({
				upToken: data.data.uptoken
			})
		}, (error) => {
			console.log(error)
		})
	},
	getTjbsidFromStorage: function () {
		let _ = this
		try {
			var tjbsid = wx.getStorageSync('_tjbsid')
			if (tjbsid) {
				_.setData({
					tjbsid: tjbsid
				})
				console.log('get tjbsid')
				_.getListData()
			} else {
				app.getUserAuth(_.getListData)
			}
		} catch (e) {
			console.log('get tjbsid from storage is fail')
		}

		/* wx.getStorage({
			key: '_tjbsid',
			success: function (res) {
				let tjbsid = res.data
				if (tjbsid) {
					_.setData({
						tjbsid: tjbsid
					})
					_.getListData()
				} else {
                    // 调用应用实例的方法获取全局数据
					app.getUserAuth(_.getListData)
				}
			},
			fail: function (res) {
				app.getUserAuth(_.getListData)
			}
		})*/
	},
	loadMore: function (e) {
		let _ = this
		let loadingData = _.data.allImgUrls.slice(0, (_.data.page + 1) * _.data.perNum)

		if (!_.data.loading) {
			return false
		}

		if (_.data.allImgUrls.length > _.data.page * _.data.perNum) {

			_.setData({
				elseImgUrls: loadingData,
				page: _.data.page + 1
			})
		} else {

			_.setData({
				loading: false
			})

		}
	},
	previewOpt: function (e) {
		let imgUrlsArr = []
		this.data.allImgUrls.map((cur, index) => {
			imgUrlsArr.push(cur.url)
			return true
		})

		wx.previewImage({
			current: e.target.dataset.current, // 当前显示图片的http链接
			urls: imgUrlsArr // 需要预览的图片http链接列表
		})
	},
	onShareAppMessage: function () {
		return {
			title: 'Hi，邀请你看看这些照片',
			desc: '轻松团建、快乐分享',
			path: `/pages/index/index?id=${this.data.id}`
		}
	},
	uploadImgOpt: function () {
		let _ = this
		wx.chooseImage({
			count: 9, // 默认9
			sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
			sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
			success: function (res) {
                // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
				let tempFilePaths = res.tempFilePaths
				let len = tempFilePaths.length

				_.setData({
					hidden: false
				})

				try {
					let unionid = wx.getStorageSync('unionid')
					if (unionid) {
						_.uploadImgSyn(0, len, tempFilePaths, unionid)
					} else {
						_.uploadImgSyn(0, len, tempFilePaths, 'o1GCawZlpGac10S5_u540rbAtIOY')
					}
				} catch (e) {
                    // Do something when catch error
				}

			}
		})
	},
	uploadImgSyn: function (index, len, tempFilePaths, unionid) {
		let _ = this

		wx.uploadFile({
			url: 'https://up.qbox.me',
			filePath: tempFilePaths[index],
			name: 'file',
			formData: {
				'token': _.data.upToken,
				'key': `cloudphotos/${_.data.id}/${unionid}/${new Date().getTime()}.${tempFilePaths[index].split('.')[1]}`
			},
			success: function (res) {
				let data = JSON.parse(res.data)
				let singleImgInfo = {
					'url': `https://img1.iytrip.com/${data.key}`,
					'addtime': new Date().getTime()
				}
				_.data.photolist.push(singleImgInfo)
				if (index + 1 < len) {
					_.uploadImgSyn(index + 1, len, tempFilePaths, unionid)
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
	uploadCDNImgUrl: function (imgUrls) {
		let _ = this
		let CDNImgUrlData = {
			'_id': _.data.id,
			'photolist': imgUrls
		}

		network.post(`${appConf.domain.api}api/cloudphotos/upload`, CDNImgUrlData, (res) => {
			let data = res.data
			if (data.code == 10000) {
				_.getListData()
			} else {
				wx.showToast({
					title: data.msg,
					icon: 'success',
					duration: 2000
				})
			}

		}, (error) => {
			console.log(error)
		})
	},
	getListData: function () {
		let _ = this
		console.log('before album info')
		try {

			network.post(`${appConf.domain.api}api/cloudphotos/albuminfo`, {'album_id': _.data.id}, (res) => {
				let data = res.data
				console.log('get album info')
				if (data.code == 10000) {
					let arr = data.data.piclist
					let deleteImgArr = []
					let wxUnionid = data.data.wx_unionid
					let addtime = data.data.addtime.substr(0, 10)
					addtime = addtime.replace(/-/g, '.')

					arr.map((index) => {
						deleteImgArr.push('no-selected')
						return true
					})
					if (arr.length > 0) {
						_.setData({
							isEmtpy: false
						})
					} else {
						_.setData({
							isEmtpy: true
						})
					}
					if (arr.length > _.data.perNum) {
						_.setData({
							loading: true
						})
					}
					_.setData({
						refresh: false,
						hidden: true
					})
					wx.setStorage({
						key: 'participatorlist',
						data: data.data.participatorlist
					})
					wx.setStorage({
						key: 'isThemeEdit',
						data: data.data.is_theme_edit
					})

					wx.getStorage({
						key: 'unionid',
						success: function (res) {
							let unionid = res.data

							if (unionid === wxUnionid) {
								_.setData({
									isAlbumAdmin: true
								})
							}
							_.setData({
								unionid: unionid
							})
						}
					})
					_.setData({
						allImgUrls: arr,
						elseImgUrls: arr.slice(0, (_.data.page + 1) * _.data.perNum),
						page: _.data.page + 1,
						theme: data.data.theme,
						sponsor: data.data.sponsor,
						participatorlist: data.data.participatorlist.slice(0, 4),
						participatorlistCount: data.data.participatorlist.length,
						pictureNum: data.data.picture_num,
						isThemeEdit: data.data.is_theme_edit,
						isAllowUpload: data.data.is_allow_upload,
						uploadPrivilege: data.data.upload_privilege || 0,
						addtime: addtime
					})

				} else if (data.code == 10001) {
					// 认证没有成功
					console.log('认证没有成功')
					app.getUserAuth(_.getListData)
				}
				wx.stopPullDownRefresh()
			}, (error) => {
				console.log('get album info error')
				console.log(error)
				wx.stopPullDownRefresh()
			})
		} catch (e) {
			console.log(`get album info: ${e}`)
		}
	},
	freshIndexPage: function () {
		let pages = getCurrentPages()
		if (pages.length > 1) {
			pages[0].getListData()
		}
	},
	onPullDownRefresh: function () {
		this.getListData()
	},
	onReachBottom: function () {
		this.loadMore()
	},
	goToManagerOpt: function () {
		let _ = this
		wx.navigateTo({
			url: `../manage/manage?id=${_.data.id}&theme=${_.data.theme}&uploadPrivilege=${_.data.uploadPrivilege}`
		})
	},
	goToUserListOpt: function () {
		wx.navigateTo({
			url: '../user/user'
		})
	}
})

