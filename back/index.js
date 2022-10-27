const puppeteer = require('puppeteer');
const HtmlTableToJson = require('html-table-to-json');
const express = require('express');
const app = express();
const fs = require('fs')


let timestamp = Date.now()



app.get('/', async function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    let data = fs.existsSync(__dirname + '/array.json') ? JSON.parse(fs.readFileSync(__dirname + '/array.json')) : false
    if (Date.now() - timestamp > 36000000 || !data) {
        await (async () => {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();

            await page.goto('https://www.investsite.com.br/seleciona_acoes.php');

            const results = '#num_result'

            await page.waitForSelector(results);
            await page.select(results, "todos");
            console.log('clicou em todos')

            await page.click('#coluna5')
            await page.click('#coluna6')
            await page.click('#coluna8')
            await page.click('#coluna12')
            await page.click('#coluna14')
            await page.click('#coluna27')
            console.log("clicou nos checkboxes")

            await page.setCacheEnabled(false);

            await page.evaluate(() => document.querySelector('#form_seleciona_acoes > input[type=submit]').click());


            console.log('clicou em procurar ações')
            // // Wait for suggest overlay to appear and click "show all results".
            const allResultsSelector = '#tabela_selecao_acoes_length > select';
            await page.waitForSelector(allResultsSelector);
            await page.select(allResultsSelector, "-1");
            const ele = await page.evaluate(() => document.querySelector("#tabela_selecao_acoes").outerHTML)
            await page.close()
            let fakedata = HtmlTableToJson.parse(ele).results[0].map(val => Object.values(val))
            let filtraritens = () => {
                fakedata.forEach((val, ind) => {
                    val.map((e, i) => {
                        if (i > 1) {
                            if (e !== "NA") {
                                let temp = parseFloat(e.replace(",", "."))
                                if (temp <= 0 || fakedata.filter((filt) => filt?.[1] == val[1]).length > 1)
                                    fakedata[ind] = undefined
                            } else {
                                fakedata[ind] = undefined
                            }
                        }
                    })
                })
                fakedata = fakedata.filter(ele => ele != undefined)
                fakedata.sort((a, b) => parseFloat(b[3]) - parseFloat(a[3]))
            }
            filtraritens()
            fs.writeFileSync(__dirname + '/array.json', JSON.stringify(fakedata))
            data = fakedata
        })()
    }


    res.send(data);
});

app.listen(3000, function () {
    console.log('App listen port 3000!');
});



