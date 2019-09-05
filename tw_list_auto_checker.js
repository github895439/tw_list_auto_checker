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

/**
 * エラーコールバック
 * (twitter-node-clientパッケージから
 * https://github.com/BoyCook/TwitterJSClient)
 *
 * @constructor
 * @param err twitter-node-clientパッケージから引用
 * @param response twitter-node-clientパッケージから引用
 * @param body twitter-node-clientパッケージから引用
 */
var error = function (err, response, body) {
    console.error('ERROR [%s]', err);
    console.error('ERROR [%s]', response);
    console.error('ERROR [%s]', body);
};

/**
 * デバッグ出力ラッパー
 *
 * @constructor
 * @param {string} str デバッグ出力文字列
 */
function DEBUG(str)
{
	if (setting.debug == "true")
	{
		console.debug("[DEBUG] " + str);
	}
}

app.engine('ejs', ejs.renderFile);
app.get('/',
	/**
	 * ツールページを返す。
	 *
	 * @constructor
	 * @param {object} req expressパッケージから引用
	 * @param {object} res expressパッケージから引用
	 */
	function (req, res) {
		res.render('main.ejs',
			/**
			 * ejs渡し初期化子
			 *
			 * @property {JSON} list 全リスト
			 * @property {JSON} setting ツール設定
			 */
			{
				list: list,
				setting: setting
			});
	});
app.get('/jquery-3.4.1.js',
	/**
	 * jqueryを返す。
	 *
	 * @constructor
	 * @param {object} req expressパッケージから引用
	 * @param {object} res expressパッケージから引用
	 */
	function (req, res)
	{
		res.send(fs.readFileSync("./script/jquery-3.4.1.js", "utf-8"));
	});

/**
 * TwitterAPIを呼び出す。
 * 同期化を考慮している。
 * (待たせる方)
 *
 * @constructor
 * @param {string} twitterUrl TwitterAPI
 */
function syncChild(twitterUrl)
{
	return new Promise(
		/**
		 * TwitterAPIを呼び出す。
		 * 同期化を考慮している。
		 * 失敗した場合はパッケージがエラー出力する。
		 * (待たせる方)
		 *
		 * @constructor
		 * @param resolve 成功コールバック
		 * @param reject 失敗コールバック
		 */
		function(resolve, reject)
				{
					client.doRequest(twitterUrl, error,
						/**
						 * twitter-node-clientパッケージの成功コールバック
						 *
						 * @constructor
						 * @param data 受信データ
						 */
						function(data)
						{
							resolve(data);
						});
				}
	);
}

app.get('/ajax/check',
	/**
	 * TwitterAPIを呼び出す。
	 * 同期化を考慮している。
	 * (待つ方)
	 *
	 * @constructor
	 * @param {object} req expressパッケージから引用
	 * @param {object} res expressパッケージから引用
	 */
	async function (req, res)
	{
		let url = req.url.split("?");
		let query = qs.parse(url[1]);
		let twitterParams = {list_id: "", count: "", include_rts: "true"};
		twitterParams.list_id = list[query.index].id;

		//初回等のチェック状態分岐
		switch (query.first)
		{
			case "true":
			{//初回
				twitterParams.count = "1";
				break;
			}
			default:
			{//その他
				twitterParams.count = "10";
				break;
			}
		}

		let path = setting.urlTwitterList + client.buildQS(twitterParams);
		let twitterUrl = client.baseUrl + path;
		//Twitterオブジェクトが出力するため不要
		// DEBUG("twitterUrl: " + twitterUrl);

		//TwitterAPI呼び出し
		let twitterRes = await syncChild(twitterUrl);

		let twitterResJson = JSON.parse(twitterRes);
		DEBUG("from twitter: " + twitterResJson.length);
		let tweet = [];

		//受信したtweetをクライアント応答に埋め込むループ
		for (let index = 0; index < twitterResJson.length; index++)
		{
			tweet.push(
				/**
				 * クライアント応答のtweet分の初期化子
				 *
				 * @property {string} tweetId tweet識別子
				 * @property {string} overview tweet内容の概要
				 */
				{
					tweetId: twitterResJson[index].id,
					overview: twitterResJson[index].text.substr(0, setting.overviewLength)
				}
			);
		}

		let result =
			/**
			 * クライアント応答の初期化子
			 *
			 * @property {string} index リストNo.
			 * @property {JSON} tweet tweet
			 */
			{
				index: query.index,
				tweet: tweet
			};				
		let resultResp = JSON.stringify(result);
		res.send(resultResp);
		DEBUG("to client: " + result.index + ", " + result.tweet.length);
	});	

app.listen(setting.port);
