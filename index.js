import puppeteer from "puppeteer";
import cheerio from "cherio";

/* export const LAUCH_PUPPETEER_OPTIONS = {
    arsg: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
    ]
} */

/* export const PAGE_PUPPETEER_OPTS = {
    networkIdle2Timeout: 5000,
    waitUntil: 'load',
    timeout: 0
}; */

const config = {
    keyWord: ["redirect"]
}

const baseURL = "https://www.youtube.com";
const foundVideoURL = [];
let resultLinks = [];

const createBrowser = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    return [browser, page];
}

const loadPage = async (url, puppeteerPage) => {
    await puppeteerPage.setDefaultNavigationTimeout(0);
    console.log("urlLoadPage", url);
    await puppeteerPage.goto(url);
    const content = await puppeteerPage.content();
    return content
}

/* const getLocation = async (url, puppeteerPage) => {
    await puppeteerPage.setDefaultNavigationTimeout(0);
    console.log("urlGetLocation", url);
    await puppeteerPage.goto(url);
    await puppeteerPage.evaluate(() => {

    });    
} */

const getLocation = async (url, redirectedPage) => {
    //const browser = await puppeteer.launch();
    //const page = await browser.newPage();
    await redirectedPage.setDefaultNavigationTimeout(0);
    await redirectedPage.goto(url);
    const location = await redirectedPage.evaluate(() => {
        return {
            location: location.href
        }
    })
    console.log("location", location)
    return location
}

const start = async () => {
    await (async () => {
        try {
            const [browser, page] = await createBrowser(); // Создали браузер (вкладку)
            const searchingCnt = await loadPage(`${baseURL}/results?search_query=warzone+hack`, page); // Страница результатов

            let $ = await cheerio.load(searchingCnt); // Загрузили в парсер нашу страницу с результатами
            const videoItems = $("a#thumbnail.yt-simple-endpoint.inline-block.style-scope.ytd-thumbnail");

            for (let i = 1; i < 3; i++) { // Заглушка, чтобы только 2 видоса парсились
                //console.log(videoItems[i].attribs.href);
                foundVideoURL.push(`https://www.youtube.com${videoItems[i].attribs.href}`); // Найденные видео по поиску            
            }
            console.log(foundVideoURL);

            // Начинаем парсить найденные видосы
            await browser.close(); // Закрываем браузер со страницей поиска (вкладку)

            await Promise.all(foundVideoURL.map(async (url) => {
                return new Promise(async (res, rej) => {
                    const [browser, page] = await createBrowser(); // Создали браузер (вкладку)
                    const trafferVideo = await loadPage(url, page); // Заходим на видос трафера
                    //console.log("trafferVideo", trafferVideo)
                    $ = await cheerio.load(trafferVideo); // Загружаем в парсер наш html
                    const descriptionCtn = $("#content .yt-simple-endpoint.style-scope.yt-formatted-string"); // Получаем ссылки в описании
                    for (let n = 0; n < descriptionCtn.length; ++n) { // Пробегаемся по всем ссылкам
                        if (descriptionCtn[n]) {
                            //console.log(descriptionCtn[n].attribs.href)
                            config.keyWord.forEach(word => { // Если в ссылке есть сигнатура, добавляем в массив
                                if (descriptionCtn[n].attribs.href.includes(word)) {
                                    resultLinks.push(descriptionCtn[n].attribs.href);
                                }

                                resultLinks = [...new Set(resultLinks)]; // Избавляемся от дубликатов
                                console.log(resultLinks);
                            })
                        } else break
                    }
                    await browser.close();
                    res()
                })
            }))
            console.log(123)
        } catch (e) {
            console.log(e)
        }
    })()
}

start()