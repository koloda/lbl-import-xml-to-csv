const fs = require('fs');
const xml2js = require('xml2js');
const translate = require('google-translate-api');
const md5 = require('md5');

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

const appState = require('../../stores/UI');

const categoriesMap = {
    "Вечерние": "Женщинам/Одежда/Платья и туники",
    "Коктейльные": "Женщинам/Одежда/Платья и туники",
    "Повседневные": "Женщинам/Одежда/Платья и туники",
    "Юбки и Шорты": "Женщинам/Одежда/Юбки и шорты",
    "Брюки и Лосины": "Женщинам/Одежда/Штаны",
    "Блузки и Рубашки": "Женщинам/Одежда/Блузы и рубашки",
    "Костюмы и комбинезоны": "Женщинам/Одежда/Комплекты и комбинезоны",
    "Платья": "Женщинам/Одежда/Платья и туники",
    "Костюмы спорт": "Женщинам/Одежда/Комплекты и комбинезоны/Спортивные костюмы",
    "Трикотажные костюмы": "Женщинам/Одежда/Комплекты и комбинезоны",
    "Кофты и туники": "Женщинам/Одежда/Платья и туники/Туники",
    "Пиджаки, кардиганы, куртки": "Женщинам/Одежда/Верхняя одежда/Куртки и ветровки",
    "Футболки, Майки, Топы": "Женщинам/Одежда/Футболки, поло и топы",
    "Комбинезоны": "Женщинам/Одежда/Комплекты и комбинезоны/Комбинезоны",
    "Пиджаки и Куртки": "Женщинам/Одежда/Верхняя одежда/Куртки и ветровки",
    "Трикотаж": "Женщинам/Одежда",
}

const cats = {
    "1": "Каталог",
    "15": "CARDO",
    "17": "Новинки",
    "64": "NOMES",
    "76": "Sale",
    "10": "Вечерние",
    "11": "Коктейльные",
    "12": "Повседневные",
    "5": "Юбки и Шорты",
    "6": "Брюки и Лосины",
    "7": "Блузки и Рубашки",
    "8": "Костюмы и комбинезоны",
    "9": "Платья",
    "13": "Костюмы спорт",
    "14": "Трикотажные костюмы",
    "60": "Кофты и туники",
    "62": "Пиджаки, кардиганы, куртки",
    "63": "Футболки, Майки, Топы",
    "66": "Юбки и Шорты",
    "67": "Брюки и Лосины",
    "68": "Блузки и Рубашки",
    "69": "Комбинезоны",
    "70": "Платья",
    "71": "Костюмы спорт",
    "72": "Трикотажные костюмы",
    "73": "Кофты и туники",
    "74": "Пиджаки и Куртки",
    "75": "Футболки, Майки, Топы",
    "77": "Юбки и Шорты",
    "78": "Брюки и Лосины",
    "79": "Блузки и Рубашки",
    "80": "Комбинезоны",
    "81": "Платья",
    "82": "Костюмы спорт",
    "83": "Трикотажные костюмы",
    "84": "Трикотаж",
    "85": "Пиджаки и Куртки",
    "86": "Футболки, Майки, Топы",
}

class Cardo {
    prodData = {};
    translatedItemsCount = 0;

    getCategory(id) {
        let key = cats[id];
        if (typeof key == 'undefined') {
            return null;
        }

        if (typeof categoriesMap[key] != 'undefined') {
            let cat = {
                main: categoriesMap[key],
                additional: null
            }
            let chain = cat.main.split('/');
            if (chain.length > 3) {
                chain = chain.slice(0, 3);
                cat.additional = chain.join('/');
            }
            return cat;
        }

        return null;
    }

    downloadFile() {
        //  display info
        this.changeInfoText('Downloading data..');

        //  download data
        const url = 'https://cardo-ua.com/get_xmlprice.php';
        var https = require('https');

        var file = fs.createWriteStream("cardo.xml");
        var request = https.get(url, (response) => {
            response.pipe(file);
            response.on('data', function() {
                // console.log('downloading...')
            });
            response.on('end', () => {
                console.log('Downloading ENDED.');
                this.processData();
            });
        });
    }

    changeInfoText(text) {
        appState.infoText = text
    }

    translate(pid, product) {
        console.log('t')
        let ttext = 'id'+pid + '|| ' + product.name;

        console.log(this);

        translate(ttext, {from: 'ru', to: 'uk'}).then((res) => {
            this.translatedItemsCount++;
            let pos = res.text.indexOf('||');
            let text = res.text.substr(pos + 3);
            let idText = res.text.substr(0, pos);
            let pid = parseInt(idText.replace('id', ''));

            console.log(this.prodData);
            let prod =this.prodData[pid];
            if (prod)
                prod[0] = text;

            if (Object.keys(this.prodData).length == this.translatedItemsCount) {
                this.saveUkrFile();
            }

        }).catch(err => {
            console.error(err);
        });
    }

    saveFile(content, fileName = 'cardo-products-import.csv', title = "Давайте збережемо наш CSV-файл для імпорту") {
        const { dialog } = require('electron').remote;
        dialog.showSaveDialog({
            title: title,
            defaultPath: fileName,
            filters: {
                extensions: ['*.csv']
            }
        }, (fname) => {
            if (fname) {
                fs.writeFile(fname, content, (err) => {
                    if (err) throw err;
                    dialog.showMessageBox({ message: 'Готово' });
                })
            } else {
                this.changeInfoText('Завершено');
            }
        });
    }

    saveUkrFile() {
        const fields = ['name', 'prc', 'num'];
        let prodsStr = "\"" + fields.join("\";\"") + "\"" + "\r\n";
        Object.keys(this.prodData).forEach(key => {
            let prod = this.prodData[key];
            prodsStr += "\"" + prod.join("\";\"") + "\"" + "\r\n";
        });

        console.log('SAVING UKR', prodsStr);
        this.saveFile(prodsStr, 'cardo-products-import-UKR.csv', 'А тепер зберігаємо українську версію');
    }

    processData() {
        var parser = new xml2js.Parser({ async: true });
        this.changeInfoText('Парсимо товари...');
        fs.readFile('cardo.xml', (err, data) => {
            parser.parseString(data, (err, result) => {
                const products = result.price.items[0].item;
                let i = 0;
                const fields = ['name', 'prc', 'cur', 'num', 'brd', 'desc', 'cat', 'addcats', 'var', 'stk', 'vimg', 'imgs',
                "kolir", "prop_style", "sezon", "material", "rozmir", "prop_length", "prop_shape", "vizerunok"];
                let prodsStr = "\"" + fields.join("\";\"") + "\"" + "\r\n";

                products.forEach((item) => {
                    i++;
                    if (i) {
                        this.changeInfoText(`Parsing product #${i}`);
                        let p = {};

                        p.name = item.name[0].replaceAll("\"", "\"\"");
                        p.prc = item.price_rrc_wos[0]; //    @todo: check real price
                        p.cur = 5;
                        p.num = item.art[0];
                        p.brd = item.vendor[0];
                        p.desc = item.description[0].replaceAll("\"", "\"\"");

                        p.cat = "Женщинам/Одежда";
                        p.addcats = " ";
                        let cat = this.getCategory(item.categoryId[0]);
                        if (cat) {
                            p.cat = cat.main;
                            if (cat.additional) {
                                p.addcats = cat.additional;
                            }
                        }
                        let pa = [];
                        pa.push(p.name)
                        pa.push(p.prc)
                        pa.push(p.cur)
                        pa.push(p.num)
                        pa.push(p.brd)
                        pa.push(p.desc)
                        pa.push(p.cat)
                        pa.push(p.addcats);
                        pa.push(' '); //var
                        pa.push(1); //stk

                        //  images
                        p.vimg = ' ';
                        p.imgs = ' ';
                        if (typeof item.picture != 'undefined' && item.picture.length) {
                            p.vimg = item.picture.pop();
                            if (item.picture.length) {
                                p.imgs = item.picture.join('|');
                            }
                        }
                        pa.push(p.vimg);
                        pa.push(p.imgs);

                        //processing properties
                        const paramsNames = ["Цвет", "Стиль", "Сезон", "Материал", "Размер", "Длина", "Фасон", "Принт"];
                        paramsNames.forEach((pn) => {
                            var val = ' ';
                            item.param.forEach((param) => {
                                if (pn == param.$.name) {
                                    val = param._;
                                }
                            });

                            pa.push(val);
                        });

                        let pid = item.product_id[0];
                        this.prodData[pid] = [p.name, p.prc, p.num];
                        this.translate(pid, p);

                        prodsStr += "\"" + pa.join("\";\"") + "\"" + "\n";
                    }
                });

                this.changeInfoText('Saving results to file');
                appState.stopProcessing();
                this.saveFile(prodsStr);
            });
        });
    };

    run() {
        this.downloadFile((file) => {
            this.processData(file);
        });
    }

    exit() {

    }
}

export default function processCardo() {
    let c = new Cardo();
    c.downloadFile();
}
