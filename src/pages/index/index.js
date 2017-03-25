let appConf = require('../../conf')

let network = require('../../util/network.js')

let app = getApp()

Page({
	data: {
		hidden: true,
		isEmtpy: false,
		hasMore: true,
		loading: false,
		newAlbumFlag: false,
		themeDisabled: '',
		sponsorDisabled: '',
		tjbsid: '',

        // 相册列表数据
		albumAllList: [],
		albumPackList: [],
		page: 0,
		perNum: 4,

		cssPadding: 'pb0',
		tapType: 2, // 1是长按 2是短按

		showDeleteAlbumModal: false,
		chooseDeleteAlbumId: '',
		moveAlbumModalClass: '',
		longTapOver: true
	},
	onLoad: function (params) {
		let _ = this
		let id = params.id
		let introduce = params.introduce

		if (id) {
			wx.navigateTo({
				url: `/pages/detail/detail?id=${id}`
			})
		}

		if (introduce) {
			wx.navigateTo({
				url: '/pages/introduce/introduce'
			})
		}

		_.getTjbsidFromStorage()
	},
	getTjbsidFromStorage: function (e) {
		let _ = this
		try {
			var tjbsid = wx.getStorageSync('_tjbsid')
			if (tjbsid) {
				_.setData({
					tjbsid: tjbsid
				})
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
	newAlbumOpt: function (e) {
		let _ = this
		_.setData({
			newAlbumFlag: true
		})
	},
	cancelNewAlbumOpt: function (e) {
		let _ = this
		_.setData({
			newAlbumFlag: false
		})
	},
	confirmNewAlbumOpt: function (e) {
		let _ = this
		let formData = e.detail.value
		if (formData.theme == '') {
			_.setData({
				themeDisabled: 'disabled'
			})
			return false
		}

		if (formData.sponsor == '') {
			_.setData({
				sponsorDisabled: 'disabled'
			})
			return false
		}
		_.setData({
			newAlbumFlag: false,
			themeDisabled: '',
			sponsorDisabled: ''
		})

		let createAlbumData = {
			'theme': formData.theme,
			'sponsor': formData.sponsor
		}

		network.post(`${appConf.domain.api}api/cloudphotos/create`, createAlbumData, (res) => {
			let data = res.data
			if (data.code == 10000) {
				_.setData({
					page: 0
				})

				wx.navigateTo({
					url: `../detail/detail?id=${data.data.id}`
				})

				_.getListData()
			}
		}, (error) => {
			console.log(error)
		})
	},
	submitEnabledOpt: function () {
		this.setData({
			themeDisabled: '',
			sponsorDisabled: ''
		})
	},
	getListData: function () {
		let _ = this

		network.post(`${appConf.domain.api}api/cloudphotos/albumlist`, {}, (res) => {
			let data = res.data
			if (data.code == 10000) {
				let arr = data.data

				_.setData({
					hidden: false
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
				//if (arr.length > _.data.perNum) {
					_.setData({
						loading: true
					})
				//}
				_.setData({
					albumAllList: arr,
					albumPackList: arr.slice(0, (_.data.page + 1) * _.data.perNum),
					page: _.data.page + 1
				})

			} else if (data.code == 10001) {
                // 认证没有成功
				console.log(`认证没有成功${data.msg}`)
				app.getUserAuth(_.getListData)
			}
			wx.stopPullDownRefresh()
		}, (error) => {
			console.log(error)
			wx.stopPullDownRefresh()
		})

	},
	goToAlbumDetail: function (e) {
		let _ = this
		let id = e.currentTarget.dataset.id

		if (_.data.tapType === 1) {
			return false
		}

		wx.navigateTo({
			url: `../detail/detail?id=${id}`
		})
	},
	deleteAlbumOpt: function () {
		let _ = this
		let jsonData = {
			'_id': _.data.chooseDeleteAlbumId
		}
		network.post(`${appConf.domain.api}api/cloudphotos/album/del`, jsonData, (res) => {
			let data = res.data
			if (data.code == 10000) {
				_.setData({
					hidden: true
				})
				_.getListData()
			} else {
				wx.showToast({
					title: data.msg,
					icon: 'success',
					duration: 2000
				})
			}
			_.setData({
				tapType: 2,
				showDeleteAlbumModal: false,
				moveAlbumModalClass: 'lower'
			})
		}, (error) => {
			console.log(error)
		})
	},
	hiddenMask: function (e) {
		this.setData({
			showDeleteAlbumModal: false,
			moveAlbumModalClass: 'lower',
			newAlbumFlag: false,
			tapType: 2
		})
	},
	onShareAppMessage: function () {
		return {
			title: 'Hi，邀请你看看这些照片',
			desc: '轻松团建、快乐分享',
			path: '/pages/index/index'
		}
	},
	onPullDownRefresh: function () {
		this.getListData()
	},
	onReachBottom: function () {
		this.loadMore()
	},
	goToIntroduceOpt: function () {
		wx.navigateTo({
			url: '../introduce/introduce'
		})
	},
	showDeleteAlbumModalOpt: function (e) {
		let id = e.currentTarget.dataset.id

		this.setData({
			showDeleteAlbumModal: true,
			chooseDeleteAlbumId: id,
			moveAlbumModalClass: 'rise',
			tapType: 1,
			longTapOver: false
		})
	}
})
