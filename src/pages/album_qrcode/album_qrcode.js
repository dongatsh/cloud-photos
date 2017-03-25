let appConf = require('../../conf')

Page({
	data: {
		id: '',
		qrcode: '',
		theme: ''
	},
	onLoad: function (params) {
		let _ = this
		_.setData({
			id: params.id,
			theme: params.theme
		})
		_.getQrcode()
	},
	onShareAppMessage: function () {
		return {
			title: 'Hi，邀请你看看这些照片',
			desc: '轻松团建、快乐分享',
			path: `pages/album_qrcode/album_qrcode?id=${this.data.id}&theme=${this.data.theme}`
		}
	},
	getQrcode: function () {
		let _ = this
		wx.request({
			url: `${appConf.domain.api}api/cloudphotos/album/createwxaqrcode`, // 仅为示例，并非真实的接口地址
			data: {
				'id': _.data.id,
				'width': 330
			},
			method: 'POST',
			header: {
				'content-type': 'application/json'
			},
			success: function (res) {
				_.setData({
					qrcode: res.data.data.url
				})
			}
		})
	},
	onPullDownRefresh: function () {
		wx.stopPullDownRefresh()
	},
	previewOpt: function (e) {
		let imgUrlsArr = []
		let imgUrl = e.target.dataset.current
		imgUrlsArr.push(imgUrl)
		wx.previewImage({
			current: imgUrl, // 当前显示图片的http链接
			urls: imgUrlsArr // 需要预览的图片http链接列表
		})
	}
})
