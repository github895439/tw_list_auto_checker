const express = require('express');
const ejs = require('ejs');
const fs = require('fs');
const qs = require('qs');
const jquery = require("jquery");

/**
 * twitter-node-clientパッケージ
 */
const Twitter = require('twitter-node-client').Twitter;

const app = express();
const list = JSON.parse(fs.readFileSync("./data/list.json", "utf-8"));
const u_const = JSON.parse(fs.readFileSync("./data/u_const.json", "utf-8"));
const setting = JSON.parse(fs.readFileSync("./data/setting.json", "utf-8"));
const client = new Twitter(JSON.parse(fs.readFileSync("./data/key.json", "utf-8")));

/**
 * テスト用保持領域
 * @static
 */
var TestValue;

/**
 * テスト動作初期化
 * @constructor
 */
function TESTINIT()
{
    //テストモードであるか
    if (setting.test == u_const.ON)
    {
        //テストパターン分岐
        switch (setting.testPattern)
        {
            case "1":
            {//1
                TestValue = 1;
                break;
            }
            case "2":
            {//2
                TestValue = 1;
                break;
            }
            default:
            {
                break;
            }
        }
    }
}

/**
 * テスト動作ラッパー
 * @constructor
 * @param {object} src 元値
 * @param {object} reference 参照情報
 * @returns {object} テスト値
 */
function TEST(src, reference)
{
    let ret;

    //テストモードであるか
    if (setting.test == u_const.ON)
    {//である
        //テストパターン分岐
        switch (setting.testPattern)
        {
            //indexが1、かつ、初回～3回目までをエラーにする
            case "1":
            {//1
                //indexが1であるか
                if (reference[0] == 1)
                {//である
                    //初回～3回目までであるか
                    if (TestValue <= 3)
                    {//である
                        //TwitterAPIの結果一式
                        ret = resultAPI(u_const.ERROR, ["e(1)", "e(2)", "e" + TestValue]);
                    }
                    else
                    {//ではない
                        ret = src;
                    }

                    TestValue++;
                }
                else
                {//ではない
                    ret = src;
                }

                break;
            }
            //indexが1、かつ、3～4回目までをエラーにする
            case "2":
            {//2
                //indexが1、かつ、3～4回目までであるか
                if (reference[0] == 1)
                {//である
                    //3～4回目までであるか
                    if ((TestValue >= 3) && (TestValue <= 4))
                    {//である
                        //TwitterAPIの結果一式
                        ret = resultAPI(u_const.ERROR, ["e(1)", "e(2)", "e" + TestValue]);
                    }
                    else
                    {//ではない
                        ret = src;
                    }

                    TestValue++;
                }
                else
                {//ではない
                    ret = src;
                }

                break;
            }
            default:
            {
                ret = src;
                break;
            }
        }

        return ret;
    }
    else
    {//ではない
        return src;
    }
}

/**
 * デバッグ動作ラッパー
 * @constructor
 * @param {string} str デバッグ出力文字列
 */
function DEBUG(str)
{
    if (setting.debug == u_const.ON)
    {
        console.debug("[DEBUG] " + str);
    }
}

app.engine('ejs', ejs.renderFile);
app.get('/',
    /**
     * ツールページを返す。
     * @param {object} req expressパッケージから引用
     * @param {object} res expressパッケージから引用
     */
    function(req, res) {
        res.render('main.ejs',
            /**
             * ejs渡し初期化子
             * @property {JSON} list 全リスト
             * @property {JSON} u_const スペルミス防止定数
             * @property {JSON} setting ツール設定
             */
            {
                list: list,
                u_const: u_const,
                setting: setting
            });
    });
app.get('/jquery-3.4.1.js',
    /**
     * jqueryファイルを返す。
     * @param {object} req expressパッケージから引用
     * @param {object} res expressパッケージから引用
     */
    function(req, res)
    {
        res.send(fs.readFileSync("./script/jquery-3.4.1.js", "utf-8"));
    });

/**
 * //TwitterAPIの結果一式(結果概要と結果詳細)
 * @constructor
 * @param {string} result "success" or "error"
 * @param {array} detail 結果の詳細
 * @returns {object} 結果一式(結果概要と結果詳細)
 */
function resultAPI(result, detail)
{
    let ret =
        /**
         * //TwitterAPIの結果一式の初期化子
         * @property {string}  result - "success" or "error"
         * @property {array}  detail - 結果の詳細
         */
        {
            result: "",
            detail: null
        };
    ret.result = result;
    ret.detail = detail;
    return ret;
}

/**
 * TwitterAPIを呼び出す。
 * 同期化を考慮している。
 * (待たせる方)
 * @constructor
 * @param {string} twitterUrl TwitterAPI
 * @returns {Promise} インスタンス
 */
function syncChild(twitterUrl)
{
    return new Promise(
        /**
         * TwitterAPIを呼び出す。
         * 同期化を考慮している。
         * 失敗した場合はパッケージがエラー出力する。
         * (待たせる方)
         * @param resolve 成功コールバック
         * @param reject 失敗コールバック
         */
        function(resolve, reject)
                {
                    client.doRequest(twitterUrl,
                        /**
                         * twitter-node-clientパッケージのerrorコールバック
                         * @param err twitter-node-clientパッケージから引用
                         * @param response twitter-node-clientパッケージから引用
                         * @param body twitter-node-clientパッケージから引用
                         */
                        function(err, response, body)
                        {
                            //TwitterAPIの結果一式
                            let ret = resultAPI(u_const.ERROR, [err, response, body]);
                            resolve(ret);
                        },
                        /**
                         * twitter-node-clientパッケージのsuccessコールバック
                         * @param data twitter-node-clientパッケージから引用
                         */
                        function(data)
                        {
                            //TwitterAPIの結果一式
                            let ret = resultAPI(u_const.SUCCESS, [data]);
                            resolve(ret);
                        });
                }
    );
}

app.get('/ajax/check',
    /**
     * TwitterAPIを呼び出す。
     * 同期化を考慮している。
     * (待つ方)
     * @param {object} req expressパッケージから引用
     * @param {object} res expressパッケージから引用
     */
    async function(req, res)
    {
        let url = req.url.split("?");
        let query = qs.parse(url[1]);
        let twitterParams = {list_id: "", count: "", include_entities: "false", include_rts: "true"};
        twitterParams.list_id = list[query.index].id;

        //初回等のチェック状態分岐
        switch (query.first)
        {
            case u_const.ON:
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

        twitterRes = TEST(twitterRes, [query.index, query.first])
        DEBUG("from twitter 1: " + twitterRes.result);
        let tweet = [];

        //successか
        if (twitterRes.result == u_const.SUCCESS)
        {//successである
            let twitterResJson = JSON.parse(twitterRes.detail[0]);
            DEBUG("from twitter 2: " + twitterResJson.length);

            //受信したtweetをクライアント応答に埋め込むループ
            for (let index = 0; index < twitterResJson.length; index++)
            {
                tweet.push(
                    /**
                     * クライアント応答のtweet分の初期化子
                     * @property {string} tweetId tweet識別子
                     * @property {string} overview tweet内容の概要
                     */
                    {
                        tweetId: twitterResJson[index].id,
                        overview: twitterResJson[index].text.substr(0, setting.overviewLength)
                    }
                );
            }
        }
        else
        {//successではない	
            console.error(twitterRes.detail[2])
        }

        let resp =
            /**
             * クライアント応答の初期化子
             * @property {string} index リストNo.
             * @property {string} result TwitterAPIの結果.
             * @property {JSON} tweet tweet
             */
            {
                index: query.index,
                result: twitterRes.result,
                tweet: tweet
            };				
        let tmpResp = JSON.stringify(resp);
        res.send(tmpResp);
        DEBUG("to client: " + [resp.index, resp.result, resp.tweet.length].join(","));
    });	

TESTINIT();
app.listen(setting.port);
