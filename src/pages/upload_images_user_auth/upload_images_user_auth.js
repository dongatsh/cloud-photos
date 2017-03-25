let appConf = require('../../conf')

let network = require('../../util/network.js')

Page({
	data: {
		id: '',
		participatorlist: [],
		notAllowUploadList: [],
		allowUploadList: [],
		unionid: ''
	},
	onLoad: function (params) {
		let _ = this
		_.setData({
			id: params.id
		})
		_.getUnionidFormStorage()
		_.getParticipatorListFormStorage()
	},
	getParticipatorListFormStorage: function () {
		let _ = this
		wx.getStorage({
			key: 'participatorlist',
			success: function (res) {
				let list = res.data
				if (list) {
					list.map((current, index) => {
						if (current.wx_unionid == _.data.unionid) {
							// upload 1 表示可以上传； 0代表不能上传； －1代表本人不能给自己加权限
							current.upload = -1
						}
						return current
					})
					_.setData({
						participatorlist: list
					})
					console.log(list)
				}
			}
		})
	},
	getUnionidFormStorage: function () {
		let _ = this
		try {
			let uid = wx.getStorageSync('unionid')
			if (uid) {
				_.setData({
					unionid: uid
				})
			}
		} catch (e) {
			console.log('cant get unionid')
		}
	},
	changeUserAuthStatusOpt: function (e) {
		let _ = this
		let index = e.currentTarget.dataset.index
		let uploadMark = e.currentTarget.dataset.uploadMark
		let list = _.data.participatorlist
		let notAllowUploadList = _.data.notAllowUploadList
		let allowUploadList = _.data.allowUploadList

		if (list[index].upload == -1) {
			return false
		}

		if (uploadMark == 1) {
			uploadMark = 0
			list[index].upload = 0
			notAllowUploadList = _.insertValueInArray(list[index].wx_unionid, notAllowUploadList)
			allowUploadList = _.deleteValueInArray(list[index].wx_unionid, allowUploadList)
		} else {
			uploadMark = 1
			list[index].upload = 1
			notAllowUploadList = _.deleteValueInArray(list[index].wx_unionid, notAllowUploadList)
			allowUploadList = _.insertValueInArray(list[index].wx_unionid, allowUploadList)
		}

		_.setData({
			participatorlist: list,
			notAllowUploadList: notAllowUploadList,
			allowUploadList: allowUploadList
		})
	},
	insertValueInArray: function (insertValue, arr) {
		// 如果insertValue不存在数组arr中，则插入
		if (arr.indexOf(insertValue) == -1) {
			arr.push(insertValue)
		}
		return arr
	},
	deleteValueInArray: function (deleteValue, arr) {
		// 如果deleteValue存在数组arr中，则删除
		let index = arr.indexOf(deleteValue)
		if (index > -1) {
			arr.splice(index, 1)
		}
		return arr
	},
	submitUploadImagesAuthOpt: function () {
		let _ = this
		let jsonData = {
			'_id': _.data.id,
			'upload_privilege': 2,
			'allow_upload_list': _.data.allowUploadList,
			'not_allow_upload_list': _.data.notAllowUploadList
		}

		network.post(`${appConf.domain.api}/api/cloudphotos/album/modify`, jsonData, (res) => {
			let data = res.data
			if (data.code == 10000) {
				wx.showToast({
					title: '权限修改成功',
					icon: 'success',
					duration: 2000
				})

				wx.redirectTo({
					url: `../upload_images_auth/upload_images_auth?id=${_.data.id}&uploadPrivilege=2`
				})
			} else {
				wx.showToast({
					title: data.msg,
					icon: 'success',
					duration: 2000
				})
			}
			_.refreshParticipatorList()

		}, (error) => {
			console.log(error)
		})
	},
	refreshParticipatorList: function () {
		let _ = this

		network.post(`${appConf.domain.api}api/cloudphotos/albuminfo`, {'album_id': _.data.id}, (res) => {
			let data = res.data
			if (data.code == 10000) {

				wx.setStorage({
					key: 'participatorlist',
					data: data.data.participatorlist
				})

				_.setData({
					participatorlist: data.data.participatorlist
				})

			} else if (data.code == 10001) {
                // 认证没有成功
				console.log('认证没有成功')
			}
		}, (error) => {
			console.log(error)
		})
	},
	onPullDownRefresh: function () {
		wx.stopPullDownRefresh()
	}
})
