let appConf = require('../../conf')

let network = require('../../util/network.js')

Page({
	data: {
		uploadPrivilege: 0, //  0. 所有人可上传 1.仅自己可上传 2. 指定人可上传
		id: ''
	},
	onLoad: function (params) {
		let _ = this
		_.setData({
			id: params.id,
			uploadPrivilege: params.uploadPrivilege
		})
	},
	chooseUploadImagesAuthOpt: function (e) {
		let _ = this
		let privilege = e.currentTarget.dataset.privilege
		_.setData({
			uploadPrivilege: privilege
		})
	},
	submitUploadImagesAuthOpt: function () {
		let _ = this
		let jsonData = {
			'_id': _.data.id,
			'upload_privilege': _.data.uploadPrivilege
		}

		network.post(`${appConf.domain.api}/api/cloudphotos/album/modify`, jsonData, (res) => {
			let data = res.data
			if (data.code == 10000) {
				wx.showToast({
					title: '设置成功',
					icon: 'success',
					duration: 2000
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
	onPullDownRefresh: function () {
		wx.stopPullDownRefresh()
	},
	goToUserAuthOpt: function () {
		let _ = this
		wx.navigateTo({
			url: `../upload_images_user_auth/upload_images_user_auth?id=${_.data.id}`
		})
	}
})
