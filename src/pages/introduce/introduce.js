Page({
	data: {
		height: 500
	},
	onLoad: function () {
		let _ = this
		_.getImageHeight()
	},
	getImageHeight: function () {
		let _ = this
		const ALTITUDE_INTERCEPT = 1712
		wx.getSystemInfo({
			success: function (res) {
				let width = res.windowWidth
				let imageHeight = (ALTITUDE_INTERCEPT * width) / 750
				_.setData({
					height: imageHeight
				})
			}
		})
	},
	onShareAppMessage: function () {
		return {
			title: 'Hi，邀请你看看这些照片',
			desc: '轻松团建、快乐分享',
			path: '/pages/index/index?introduce=1'
		}
	},
	onPullDownRefresh: function () {
		wx.stopPullDownRefresh()
	}
})
