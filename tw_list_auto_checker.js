const express = require('express');
const ejs = require('ejs');
const fs = require('fs');
const qs = require('qs');
const Twitter = require('twitter-node-client').Twitter;
const jquery = require("jquery");

const app = express();
const setting = JSON.parse(fs.readFileSync("./data/setting.json", "utf-8"));
const list = JSON.parse(fs.readFileSync("./data/list.json","utf-8"));
const client = new Twitter(JSON.parse(fs.readFileSync("./data/key.json","utf-8")));

var error = function (err, response, body) {
    console.error('ERROR [%s]', err);
    console.error('ERROR [%s]', response);
    console.error('ERROR [%s]', body);
};

function DEBUG(str)
{
	if (setting.debug == "true")
	{
		console.debug("[DEBUG] " + str);
	}
}

app.engine('ejs', ejs.renderFile);
app.get('/',
	function (req, res) {
		res.render('main.ejs',
			{
				list: list,
				setting: setting
			});
	});
app.get('/jquery-3.4.1.js',
	function (req, res)
	{
		res.send(fs.readFileSync("./script/jquery-3.4.1.js", "utf-8"));
	});

function syncChild(twitterUrl)
{
	return new Promise(
		function(resolve, reject)
		{
			client.doRequest(twitterUrl, error,
				function(data)
				{
					resolve(data);
				});
		}
	);
}

app.get('/ajax/check',
	async function (req, res)
	{
		let url = req.url.split("?");
		let query = qs.parse(url[1]);
		let twitterParams = {list_id: "", count: "", include_rts: "true"};
		twitterParams.list_id = list[query.index].id;
		switch (query.first)
		{
			case "true":
			{
				twitterParams.count = "1";
				break;
			}
			default:
			{
				twitterParams.count = "10";
				break;
			}
		}
		let path = setting.urlTwitterList + client.buildQS(twitterParams);
		let twitterUrl = client.baseUrl + path;
		//Twitterオブジェクトが出力するため不要
		// DEBUG("twitterUrl: " + twitterUrl);
		let twitterRes = await syncChild(twitterUrl);
		let twitterResJson = JSON.parse(twitterRes);
		DEBUG("from twitter: " + twitterResJson.length);
		let tweet = [];
		for (let index = 0; index < twitterResJson.length; index++)
		{
			tweet.push(
				{
					tweetId: twitterResJson[index].id,
					overview: twitterResJson[index].text.substr(0, setting.overviewLength)
				}
			);
		}
		let result =
			{
				index: query.index,
				tweet: tweet
			};				
		let resultResp = JSON.stringify(result);
		res.send(resultResp);
		DEBUG("to client: " + result.index + ", " + result.tweet.length);
	});	

app.listen(setting.port);
