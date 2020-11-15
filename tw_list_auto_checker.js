const express = require('express');
const ejs = require('ejs');
const fs = require('fs');
const qs = require('qs');
const jquery = require("jquery");

/**
 * twitter-node-clientパッケージ
 */
const Twitter = require('twitter-node-client').Twitter;

const App = express();
const List = JSON.parse(fs.readFileSync("./data/list.json", "utf-8"));
const AppConst = JSON.parse(fs.readFileSync("./data/appconst.json", "utf-8"));
const Setting = JSON.parse(fs.readFileSync("./data/setting.json", "utf-8"));
const Client = new Twitter(JSON.parse(fs.readFileSync("./data/key.json", "utf-8")));

Setting.notificationsOrder = JSON.stringify(Setting.notificationsOrder);

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
    if (Setting.test == AppConst.ON)
    {
        //テストパターン分岐
        switch (Setting.testPattern)
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

    return;
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
    if (Setting.test == AppConst.ON)
    {//である
        //テストパターン分岐
        switch (Setting.testPattern)
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
                        ret = resultAPI(AppConst.ERROR, ["e(1)", "e(2)", "e" + TestValue]);
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
                        ret = resultAPI(AppConst.ERROR, ["e(1)", "e(2)", "e" + TestValue]);
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
    }
    else
    {//ではない
        ret = src;
    }

    return ret;
}

/**
 * デバッグ動作ラッパー
 * @constructor
 * @param {string} str デバッグ出力文字列
 */
function DEBUG(str)
{
    if (Setting.debug == AppConst.ON)
    {
        console.debug("[DEBUG] " + str);
    }

    return;
}

/**
 * 致命的エラーで終了
 * エラー情報を出力して終了する。
 * @constructor
 * @param {string} func 関数名
 * @param {object} errorInfo エラー情報
 */
function fatal(func, errorInfo)
{
    console.log("function:" + func);
    console.log(errorInfo);
    process.exit();
}

App.engine('ejs', ejs.renderFile);
App.get('/',
    /**
     * ツールページを返す。
     * @param {object} req expressパッケージから引用
     * @param {object} res expressパッケージから引用
     */
    function(req, res)
    {
        res.render('main.ejs',
            /**
             * ejs渡し初期化子
             * @property {JSON} List 全リスト
             * @property {JSON} AppConst スペルミス防止定数
             * @property {JSON} Setting ツール設定
             */
            {
                List: List,
                AppConst: AppConst,
                Setting: Setting
            });
    });
App.get('/jquery-3.4.1.js',
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
 * @param {string} result AppConst.SUCCESSかAppConst.ERROR
 * @param {array} detail 結果の詳細
 * @returns {object} 結果一式(結果概要と結果詳細)
 */
function resultAPI(result, detail)
{
    let ret =
        /**
         * //TwitterAPIの結果一式の初期化子
         * @property {string}  result - AppConst.SUCCESSかAppConst.ERROR
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
 * 同期化している。
 * @constructor
 * @param {string} twitterUrl TwitterAPI
 * @returns {Promise} インスタンス
 */
function syncDoRequest(twitterUrl)
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
            Client.doRequest(twitterUrl,
                /**
                 * twitter-node-clientパッケージのerrorコールバック
                 * @param err twitter-node-clientパッケージから引用
                 * @param response twitter-node-clientパッケージから引用
                 * @param body twitter-node-clientパッケージから引用
                 */
                function(err, response, body)
                {
                    //TwitterAPIの結果一式
                    let ret = resultAPI(AppConst.ERROR, [err, response, body]);
                    resolve(ret);
                },
                /**
                 * twitter-node-clientパッケージのsuccessコールバック
                 * @param data twitter-node-clientパッケージから引用
                 */
                function(data)
                {
                    //TwitterAPIの結果一式
                    let ret = resultAPI(AppConst.SUCCESS, [data]);
                    resolve(ret);
                });
        });
}

/**
 * URL(クエリー含む)を作るための材料を格納する。
 * @constructor
 * @param {object} query パースしたクエリー
 * @returns {object} URL(クエリー含む)を作るための材料
 */
function setUrlMaterial(query)
{
    let ret = {};
    let twitterParams;

    //ターゲットがリストか
    if (!isNaN(parseInt(query[Setting.checkIf.req.index])))
    {//である
        ret["url"] = Setting.urlTwitterApi["list"].url;
        twitterParams =
            {
                "list_id": List[query[Setting.checkIf.req.index]].id,
                "include_entities": "false",
                "include_rts": "true"
            };

        //初回等のチェック状態分岐
        switch (query[Setting.checkIf.req.first])
        {
            case AppConst.ON:
            {//初回である
                twitterParams["count"] = "1";
                break;
            }
            case AppConst.OFF:
            {//初回ではない
                twitterParams["count"] = "10";
                break;
            }
            default:
            {//他
                //機能的には起こらない
                fatal(arguments.callee.name, query[Setting.checkIf.req.first]);
            }
        }
    }
    else
    {//ではない
        //ターゲットで分岐
        switch (query[Setting.checkIf.req.index])
        {
            case AppConst.MT:
            {//返信
                ret["url"] = Setting.urlTwitterApi["mt"].url;
                twitterParams =
                    {
                        "q": "to:" + Setting.me + " -from:" + Setting.me,
                        "result_type": "recent"
                    };

                //初回等のチェック状態分岐
                switch (query[Setting.checkIf.req.first])
                {
                    case AppConst.ON:
                    {//初回である
                        twitterParams["count"] = "1";
                        break;
                    }
                    case AppConst.OFF:
                    {//初回ではない
                        twitterParams["count"] = "10";
                        break;
                    }
                    default:
                    {//他
                        //機能的には起こらない
                        fatal(arguments.callee.name, query[Setting.checkIf.req.first]);
                    }
                }
    
                break;
            }
            case AppConst.RT:
            {//RT
                ret["url"] = Setting.urlTwitterApi["rt"].url;
                twitterParams =
                    {
                        "trim_user": "true",
                        "include_entities": "false",
                        "include_user_entities": "false"
                    };

                //初回等のチェック状態分岐
                switch (query[Setting.checkIf.req.first])
                {
                    case AppConst.ON:
                    {//初回である
                        twitterParams["count"] = "1";
                        break;
                    }
                    case AppConst.OFF:
                    {//初回ではない
                        twitterParams["count"] = "10";
                        break;
                    }
                    default:
                    {//他
                        //機能的には起こらない
                        fatal(arguments.callee.name, query[Setting.checkIf.req.first]);
                    }
                }
    
                break;
            }
            case AppConst.FOLLOW:
            {//フォロー
                ret["url"] = Setting.urlTwitterApi["follow"].url;
                twitterParams = {"screen_name": Setting.me};
    
                break;
            }
            default:
            {//他
                //機能的には起こらない
                fatal(arguments.callee.name, query[Setting.checkIf.req.index]);
            }
        }
    }

    ret["params"] = twitterParams;
    return ret;
}

/**
 * TwitterAPIを呼び出す。
 * 同期化している。
 * @constructor
 * @param {object} query パースしたクエリー
 * @returns {object} TwitterAPIの結果
 */
async function callTwitterApi(query)
{
    //クエリーパラメーター格納
    let material = setUrlMaterial(query);

    let path = material["url"] + Client.buildQS(material["params"]);
    let twitterUrl = Client.baseUrl + path;
    //Twitterオブジェクトが出力するため不要
    // DEBUG("twitterUrl: " + twitterUrl);

    //TwitterAPI呼び出し
    let ret = await syncDoRequest(twitterUrl);

    return ret;
}

/**
 * クライアントへのデータを格納する。
 * @constructor
 * @param {string} reqIndex ターゲット
 * @param {JSON} resJson レスポンスのJSONパース
 * @returns {object} クライアントへのデータ
 */
function setDataToClient(reqIndex, resJson)
{
    let ret = [];
    DEBUG("from twitter 2: " + resJson.length);

    //ターゲットがリストか
    if (!isNaN(parseInt(reqIndex)))
    {//である
        //レスポンスをクライアントへのデータに格納するループ
        for (let index = 0; index < resJson.length; index++)
        {
            let data = {};
            data[Setting.checkIf.res.list.tweedId] = resJson[index].id;
            data[Setting.checkIf.res.list.overview] = resJson[index].text.substr(0, Setting.overviewLength);
            ret.push(data);
        }
    }
    else
    {//ではない
        //ターゲットで分岐
        switch (reqIndex)
        {
            case AppConst.MT:
            {//返信
                //レスポンスをクライアントへのデータに格納するループ
                for (let index = 0; index < resJson.length; index++)
                {
                    let data = {};
                    data[Setting.checkIf.res.mt.tweedId] = resJson[index].id;
                    ret.push(data);
                }

                break;
            }
            case AppConst.RT:
            {//RT
                //レスポンスをクライアントへのデータに格納するループ
                for (let index = 0; index < resJson.length; index++)
                {
                    let data = {};
                    data[Setting.checkIf.res.rt.tweedId] = resJson[index].id;
                    data[Setting.checkIf.res.rt.rtCount] = resJson[index].retweet_count;
                    ret.push(data);
                }

                break;
            }
            case AppConst.FOLLOW:
            {//フォロー
                ret = resJson.ids;
                break;
            }
            default:
            {//他
                //機能的には起こらない
                fatal(arguments.callee.name, index);
            }
        }
    }

    return ret;
}

App.get('/ajax/check',
    /**
     * TwitterAPIを呼び出す。
     * @param {object} req expressパッケージから引用
     * @param {object} res expressパッケージから引用
     */
    async function(req, res)
    {
        let url = req.url.split("?");
        let query = qs.parse(url[1]);

        //TwitterAPI呼び出し
        let twitterRes = await callTwitterApi(query);

        twitterRes = TEST(twitterRes, [query[Setting.checkIf.req.index], query[Setting.checkIf.req.first]]);
        DEBUG("from twitter 1: " + twitterRes.result);
        let data;
    
        //successか
        if (twitterRes.result == AppConst.SUCCESS)
        {//successである
            //クライアントへのデータ格納
            data = setDataToClient(query[Setting.checkIf.req.index], JSON.parse(twitterRes.detail[0]));
        }
        else
        {//successではない
            //bodyがあるか
            if (typeof(twitterRes.detail[2]) != "undefined")
            {//ある
                data = twitterRes.detail[2];
            }
            else
            {//ない
                data = [twitterRes.detail[0].errno, twitterRes.detail[0].code].join(",");
            }

            console.error(data);
        }
    
        let tmpRes = {};
        tmpRes[Setting.checkIf.res.index] = query[Setting.checkIf.req.index];
        tmpRes[Setting.checkIf.res.result] = twitterRes.result;
        tmpRes[Setting.checkIf.res.data] = data;
        let tmpResJson = JSON.stringify(tmpRes);
        res.send(tmpResJson);
        DEBUG("to client: " + [tmpRes[Setting.checkIf.res.index], tmpRes[Setting.checkIf.res.result], (tmpRes[Setting.checkIf.res.data].hasOwnProperty("length") ? tmpRes[Setting.checkIf.res.data].hasOwnProperty("length") : "")].join(","));
    });	

TESTINIT();
App.listen(Setting.nodejs.port);
