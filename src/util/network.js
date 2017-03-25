/**
 * url 请求地址
 * success 成功的回调
 * fail 失败的回调
 */
function _post (url, data, success, fail) {
	try {
		var tjbsid = wx.getStorageSync('_tjbsid')

		if (tjbsid) {
			data._tjbsid = tjbsid
			wx.request({
				url: url,
				method: 'POST',
				data: data,
				success: function (res) {
					success(res)
				},
				fail: function (res) {
					fail(res)
				}
			})
		} else {
			console.log('get no tjbsid')
		}
	} catch (e) {
		console.log(`post in error: ${e}`)
	}

}

/**
 * url 请求地址
 * success 成功的回调
 * fail 失败的回调
 */
function _get (url, success, fail) {

	wx.request({
		url: url,
		method: 'GET',
		success: function (res) {
			success(res)
		},
		fail: function (res) {
			fail(res)
		}
	})
}

module.exports = {
	get: _get,
	post: _post
}
