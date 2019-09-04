const Twitter = require('twitter-node-client').Twitter;
const fs = require("fs");

const client = new Twitter(JSON.parse(fs.readFileSync("./data/key.json","utf-8")));

var error = function (err, response, body) {
    console.error('ERROR [%s]', err);
    console.error('ERROR [%s]', response);
    console.error('ERROR [%s]', body);
};

if (1)
{
    params = {screen_name: 'tw388192'};
    console.log("@" + params.screen_name);
    var path = '/lists/list.json' + client.buildQS(params);
    var url = client.baseUrl + path;
    client.doRequest(url, error, function(data){
        obj = JSON.parse(data);
        console.log(obj[0]);
        console.log(obj.length);
        obj.forEach(element => {
            let str =
                [
                    element.name,
                    element.id_str
                ];
            console.log(str.join(", "));
        });
    });
}
