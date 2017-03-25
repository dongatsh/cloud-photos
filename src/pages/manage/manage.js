let appConf = require('../../conf')

let network = require('../../util/network.js')

Page({
	data: {
		changeThemeNameFlag: false,
		id: '',
		theme: '',
		themeDisabled: '',
		isThemeEdit: false,
		uploadPrivilege: 0
	},
	onLoad: function (params) {
		let _ = this
		_.setData({
			id: params.id,
			theme: params.theme,
			uploadPrivilege: params.uploadPrivilege
		})

		wx.getStorage({
			key: 'isThemeEdit',
			success: function (res) {
				_.setData({
					isThemeEdit: res.data
				})
			}
		})

		wx.stopPullDownRefresh()
	},
	saveNewThemeNameOpt: function (e) {
		let _ = this

		let formData = e.detail.value
		if (formData.theme == '') {
			_.setData({
				themeDisabled: 'disabled'
			})
			return false
		}

		_.setData({
			changeThemeNameFlag: false
		})

		let jsonData = {
			'_id': _.data.id,
			'theme': formData.theme
		}

		network.post(`${appConf.domain.api}/api/cloudphotos/album/modify`, jsonData, (res) => {
			let data = res.data
			if (data.code == 10000) {
				_.setData({
					theme: formData.theme
				})
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
	cancelNewAlbumOpt: function (e) {
		let _ = this
		_.setData({
			changeThemeNameFlag: false
		})
	},
	popupAlbumWrapperOpt: function (e) {
		let _ = this
		_.setData({
			changeThemeNameFlag: true
		})
	},
	onPullDownRefresh: function () {
		wx.stopPullDownRefresh()
	}
})
