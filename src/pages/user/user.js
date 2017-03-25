Page({
	data: {
		participatorlist: []
	},
	onLoad: function () {
		let _ = this
		wx.getStorage({
			key: 'participatorlist',
			success: function (res) {
				let participatorlist = res.data
				_.setData({
					participatorlist: participatorlist
				})
			},
			fail: function (res) {
				console.log('get participatorlist error')
			}
		})
	}
})
