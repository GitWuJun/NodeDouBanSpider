

//用于读写数据的库
const fs = require('fs')
//用于解析url的库=
const url = require('url')
//异步处理函数库
// const async = require('async')
//像jQuery一样解析操作DOM的库
const cheerio = require('cheerio');
//基础url
const baseUrl = 'https://movie.douban.com/top250'


//通过发送请求，获取基础数据
const getBaseData = (sUrl,page)=>{
	//将目标url解析成为一个url的对象
	let urlObj = url.parse(sUrl+`?start=${(page-1)*25}`)
	//判断是http请求还是https请求
	if (urlObj.protocol == 'http:') {
		var http = require('http')
	}else if(urlObj.protocol == 'https:'){
		var http = require('https')
	}
	//请求的参数
	const reqOptions = {
		'hostname':urlObj.hostname,
		'path':urlObj.path
	}
	//请求对象
	let req = http.request(reqOptions,response=>{
		if (response.statusCode == 200) {
			var data = []
			response.on('data',buffer=>{
				data.push(buffer)
			})
			//请求结束
			response.on('end',()=>{
				//结束后，将buffer转换成字符串传入到成功回调中
				if (data) {
					parseData(data.toString(),page)
				}
				
			})
		}else{
			console.log(`请求发生错误:ErrorCode:${res.statusCode}`)
		}
	})

	req.end()
}

//创建文件夹--返回一个promise对象，可以进行链式调用
const creatDir  = (dirPath)=>{
	return new Promise((resolve, reject)=>{
		fs.exists(dirPath,exist=>{
		if (!exist) {//文件夹不存
			fs.mkdir(dirPath,err=>{
				if (err) {
					console.log(`创建文件夹失败:${err}`)
					reject(`创建文件夹失败:${err}`)
				}else{
					resolve(dirPath)
				}
			})
		}else{
			resolve(dirPath)
		}
	})
	})
}

//使用cheerio解析数据
const parseData = (data,page)=>{
	let dirPath = `./第${page}页`
	creatDir(dirPath)
	.then(res=>{
		var $ = cheerio.load(data)
	//通过li标签找到电影列表
	var movieList = $('.grid_view').find('li')
	var resultArr = []
	//遍历列表
	movieList.each((index,element)=>{

		let info = $(element).find('.info')
		let pic = $(element).find('.pic')
		const scroe = info.find('.rating_num').text()
		const name = info.find('.title').text()
		const imgUrl = pic.find('a').children('img').attr('src')
		getPicBuffer(res,name,imgUrl,page)
		//将所需数据解析并封装成一个json对象
		var result = {
			'name':name,
			'scroe':scroe,
			'imgUrl':imgUrl
		}
		//需要将json对象转换成json格式的字符串放入到数组中
		resultArr.push(JSON.stringify(result))
	})
	writeFile(res,resultArr,page)
}).catch(err=>{
	console.log(err)

})

}

//使用http模块根据图片url获取到图片的buffer
const getPicBuffer = (dirPath,name,imgUrl,page)=>{
	let urlObj = url.parse(imgUrl)
	//判断是http请求还是https请求
	if (urlObj.protocol == 'http:') {
		var http = require('http')
	}else if(urlObj.protocol == 'https:'){
		var http = require('https')
	}
	//请求的参数
	const reqOptions = {
		'hostname':urlObj.hostname,
		'path':urlObj.path
	}
	//请求对象
	let req = http.request(reqOptions,response=>{
		if (response.statusCode == 200) {
			var data = []
			response.on('data',buffer=>{
				data.push(buffer)
			})
			//请求结束
			response.on('end',()=>{
				//结束后，将buffer转换成字符串传入到成功回调中
				// success&&success(data.toString())
				if (data) {
					let result = Buffer.concat(data)
					// success&&success(result)
					writePic(dirPath,name,result,page)
				}
				
			})
		}else{
			console.log(`请求发生错误:ErrorCode:${res.statusCode}`)
		}
	})
	req.end()

}

//将json格式的数据以txt的形式存入到本地
const writeFile = (dirPath,data,page)=>{
	//文件路径拼接
	let filePath = `${dirPath}/doubanTop250_page${page}.txt`
	fs.writeFile(filePath,data,(err)=>{
		if (err) {
			console.log(`抓取第${page}页失败:${err}`)
		}else{
			console.log(`抓取完毕第${page}页!`) 
		}
	})
}

//将图片数据存到本地
const writePic = (dirPath,name,data,page)=>{
		//图片路径拼接--name有空格和/，需要进行分割并且去除空格
	let picPath = `${dirPath}/${name.split('/')[0].trim()}.jpg`
	fs.writeFile(`${picPath}`,data,(err)=>{
		if (err) {
			console.log(`抓取图片${name}失败:${err}`)
		}
	})

}

//总共抓取多少页的数据
const count = 10

//循环抓取
for(let i = 1;i < count+1;i ++){
	getBaseData(baseUrl,i)
}
