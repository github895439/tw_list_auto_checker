本内容を利用した場合の一切の責任を私は負いません。

# 機能
JSONにTwitterリストを列挙しておくと、自動的に一定間隔(10秒)で未読をチェックし、未読数をタイトル(リストNo.順に上位桁からで、1リストが1桁分に相当)に反映する。  
(タイトルに反映すると、ブラウザのタブ自体に反映されるため、そのタブがアクティブでなくてもわかる。)  
未読数は9までチェックし、超えると「*」になり、チェックされなくなる。  
(リセットすれば再開される。)  
未読のリセットはリストのリンクをクリックする。  
チェック停止チェックボックスをチェック入りにするとチェックが停止し、チェック外れにすると再開する。  
チェック間隔等はJSONに設定できる。  
スナップ.PNGがスナップである。

# バージョン
- OS  
OS 名:                  Microsoft Windows 10 Home  
OS バージョン:          10.0.18362 N/A ビルド 18362   
システムの種類:         x64-based PC  
- Chrome  
バージョン: 76.0.3809.132（Official Build） （64 ビット）
- jquery  
jquery-3.4.1.js
- node.js  
node-v10.16.0-win-x64  
ejs@2.6.2  
express@4.17.1  
jquery@3.4.1  
qs@6.8.0  
twitter-node-client@0.0.6

# 環境作成
node.jsをインストールする。  
(私の場合はインストーラではなくアーカイブ版を使用したため、使用時にパス(PATH、NODE_PATH)を通している。)  
「バージョン」に列挙したnode.jsパッケージをnpmでインストールする。

# 導入(Twitterのアプリ連携キーの取得)
Twitter公式の下記で取得する。  
(writeする機能は無いことと、安全性から、権限はread属性のみにする。)  
https://developer.twitter.com/en/apps  
下記が参考になる。  
https://qiita.com/y_ishihara/items/501bb6fddc785a56780e )

# 導入(チェッカー)
下記のgithubのリポジトリをダウンロードする。  
★  
ダウンロードしたものを展開する。  
data/key.jsonファイルに「導入(Twitterのアプリ連携キーの取得)」で取得したキーを入力する。  
(「""」で括る。)  
data/list.jsonファイルにチェックするTwitterリストのid_str、リスト別名、URLを入力する。  
(リスト別名はチェッカーの表示名であるため、リストの正式名でなくても構わない。  
id_strはリストの識別子で、リストの値がわからない場合は、ツールに含まれるget_tw_list_id_str.jsファイルを使用する。  
「node get_tw_list_id_str.js」を実行すると、自分のリストの一覧が表示される。)  
チェック間隔等はdata/setting.jsonファイルが持っている。

# 使用
「node tw_list_auto_checker.js」を実行する。  
Chromeから「 http://localhost:8080/ 」を表示する。  
node.jsの停止はCTRL+cで停止できる。  
(引き数無しで実行した場合は「.exit」で停止できる。)  
私の場合は10弱のリストをチェックしているため、まずChromeの1ウィンドウでこのツールを表示する。  
ウィンドウの横幅を調節すれば、チェックしているリスト全てをそのウィンドウのタブで開いても、ツールのタブ自体の未読表示が欠けることはない。  
タブ自体だけを確認し、未読が見たくなったらツールのタブ内のリンクを押す。  
リンクの表示は識別子を指定しているので、いつも同じリストごとのタブに表示され、タブが増え続けることはない。

# 備考
node.jsを使わず、オフライン(ローカルファイルからajaxでTwitterAPIを使用)で行おうと思ったが、OAuthが手間だったことと、リセット方法が暫定であるため、node.jsを使用した。  
暫定とは、Javascript経由でボタンからリストを開く確実な方法の場合はCORSに阻まれたため、aタグのonclickハンドラの実働(ハンドラが終わった後にリンクが開かれる)を元にして実装している。  
Chromeは.ejsファイルをHTMLと解釈しないがFireFoxは解釈するためプレビューに使える。  
Twitterの「通知」チェックも行うつもりだったが、通知のAPIがないことと、いいねされたリストを取得するAPIが無いことから断念した。  
おそらくだが、JSON.parse()は元の値を括っていた「""」を取り除く。  
リストの識別子は、何故かは知らないがidではなくid_strが正しそう。  
開発環境はVisual Studio Codeを使用した。  
必要以上に同期化しているのは、JSON.parse()が非同期に見えることと、アクセス量を制御できるようにようにする(並行禁止。仕様上限は900アクセス/15分(=900秒)。)ため。  
実働を見るとAPIのcountは完全な時系列の配列ではなく、スレッド分は階層になっているように見える。  
このため未読数は厳密ではない。  
(チェックは配列分のみに対して行っているため。)

# 参考
- 全般(HTML、CSS、Javascript、jquery、node.js)  
http://www.tohoho-web.com/www.htm
- リストAPI  
https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/get-lists-statuses
- twitter-node-clientパッケージ  
https://github.com/BoyCook/TwitterJSClient
- クエリ文字列処理  
https://dev.classmethod.jp/server-side/node-js-server-side/q/
- ejs(node.jsのテンプレート機能。JSP、ASPのようなもの。)  
https://ejs.co/
- ejsでモジュールを使用  
https://qiita.com/SFPGMR/items/77a9a7a43d2f1ed181a8
https://github.com/mde/ejs
- node.jsでファイル読み  
https://www.sejuku.net/blog/71663
- 同期化  
https://qiita.com/suin/items/97041d3e0691c12f4974
- JSONにコメント  
https://www.nxworld.net/tips/use-comment-in-json.html
