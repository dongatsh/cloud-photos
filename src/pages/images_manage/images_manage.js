let appConf = require('../../conf')

let network = require('../../util/network.js')

let md5 = require('../../lib/md5')

let app = getApp()

Page({
	data: {
		hidden: false,
		isEmtpy: false,
		loading: false,
		refresh: false,
		id: '',
		allImgUrls: [],
		elseImgUrls: [],
		page: 0,
		perNum: 18,
		chooseDeleteImgClass: [],
		chooseDeleteImgNum: 0,
		chooseDeleteImg: []
	},
	onLoad: function (params) {
		let _ = this

		_.setData({
			id: params.id
		})
		_.getListData()
	},
	getListData: function () {
		let _ = this

		network.post(`${appConf.domain.api}api/cloudphotos/albuminfo`, {'album_id': _.data.id}, (res) => {
			let data = res.data
			if (data.code == 10000) {
				let arr = data.data.piclist
				let deleteImgArr = []
				let ownImagesArr = _.getImagesList(data.data.is_theme_edit, arr)
				if (ownImagesArr.length > 0) {
					_.setData({
						isEmtpy: false
					})
				} else {
					_.setData({
						isEmtpy: true
					})
				}
				if (ownImagesArr.length > _.data.perNum) {
					_.setData({
						loading: true
					})
				}
				ownImagesArr.map((index) => {
					deleteImgArr.push('no-selected')
					return true
				})

				_.setData({
					refresh: false,
					hidden: true,
					allImgUrls: ownImagesArr,
					elseImgUrls: ownImagesArr.slice(0, (_.data.page + 1) * _.data.perNum),
					page: _.data.page + 1,
					chooseDeleteImgClass: deleteImgArr
				})

			} else if (data.code == 10001) {
                // 认证没有成功
				console.log('认证没有成功')
				app.getUserAuth(_.getListData)
			}
		}, (error) => {
			console.log(error)
		})
	},
	chooseImgToDeleteOpt: function (e) {
		let _ = this
		let currentImg = e.target.dataset.current
		let deleteImgArr = _.data.chooseDeleteImg || []
		let deleteImgIndex = deleteImgArr.indexOf(currentImg)
		let selectImgArr = _.data.chooseDeleteImgClass || []
		let num = e.target.dataset.num
		let chooseDeleteImgNum = _.data.chooseDeleteImgNum

		if (deleteImgIndex < 0) {
			deleteImgArr.push(currentImg)
			selectImgArr[num] = 'selected'
			chooseDeleteImgNum = chooseDeleteImgNum + 1
		} else {
			deleteImgArr.splice(deleteImgIndex, 1)
			selectImgArr[num] = 'no-selected'
			chooseDeleteImgNum = chooseDeleteImgNum - 1
		}
		_.setData({
			chooseDeleteImg: deleteImgArr,
			chooseDeleteImgClass: selectImgArr,
			chooseDeleteImgNum: chooseDeleteImgNum
		})
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
	getImagesList: function (mark, arr) {
		if (mark) {
			return arr
		}

		let unionid = ''
		try {
			var value = wx.getStorageSync('unionid')
			if (value) {
				unionid = value
			}
		} catch (e) {
			console.log('no unionid from storage')
		}

		let ownImagesArr = []
		arr.map((current, index) => {
			if (current.unionid == unionid) {
				ownImagesArr.push(current)
			}
			return current
		})
		return ownImagesArr
	},
	confirmDeleteImgsOpt: function () {
		let _ = this
		let chooseDeleteImgCount = _.data.chooseDeleteImg.length
		let remindContent = `删除${chooseDeleteImgCount}张照片？删除后，将无法恢复`

		if (chooseDeleteImgCount == 0) {
			return false
		}

		wx.showModal({
			title: '提示',
			content: remindContent,
			success: function (res) {
				if (res.confirm) {
					_.deleteImgsOpt()
				}
			}
		})
	},
	deleteImgsOpt: function () {
		let _ = this
		let deleteImgs = _.data.chooseDeleteImg
		let md5DeleteImgs = []
		let jsonData = {
			_id: _.data.id
		}

		deleteImgs.forEach((item, index, input) => {
			md5DeleteImgs.push(md5.hex_md5(input[index]))
		})

		jsonData.piclist = md5DeleteImgs

		network.post(`${appConf.domain.api}/api/cloudphotos/album/photo/del`, jsonData, (res) => {
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

			_.setData({
				chooseDeleteImgNum: 0,
				chooseDeleteImg: []
			})

		}, (error) => {
			console.log(error)
		})

	},
	cancelDeleteImgsOpt: function () {
		let _ = this
		let arr = _.data.chooseDeleteImgClass
		arr.forEach((item, index, input) => {
			input[index] = 'no-selected'
		})

		_.setData({
			chooseDeleteImgClass: arr,
			chooseDeleteImg: [],
			chooseDeleteImgNum: 0
		})
	},
	onPullDownRefresh: function () {
		wx.stopPullDownRefresh()
	}
})
