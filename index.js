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
    try {
        const [browser, page] = await createBrowser(); // Создали браузер (вкладку)
        const searchingCnt = await loadPage(`${baseURL}/results?search_query=warzone+hack`, page); // Страница результатов

        let $ = cheerio.load(searchingCnt); // Загрузили в парсер нашу страницу с результатами
        const videoItems = $("a#thumbnail.yt-simple-endpoint.inline-block.style-scope.ytd-thumbnail");

        for (let i = 1; i < 3; i++) {
            //console.log(videoItems[i].attribs.href);
            foundVideoURL.push(`https://www.youtube.com${videoItems[i].attribs.href}`); // Найденные видео по поиску            
        }
        console.log(foundVideoURL);

        // Начинаем парсить найденные видосы
        browser.close(); // Закрываем браузер со страницей поиска (вкладку)
        foundVideoURL.forEach(async (url) => {
            const [browser, page] = await createBrowser(); // Создали браузер (вкладку)
            const trafferVideo = await loadPage(url, page); // Заходим на видос трафера
            //console.log("trafferVideo", trafferVideo)
            $ = cheerio.load(trafferVideo); // Загружаем в парсер наш html
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

            browser.close();

            const [redirectedBrowser, redirectedPage] = await createBrowser()

            await getLocation("https://www.youtube.com/redirect?event=video_description&redir_token=QUFFLUhqbVFnM21SLW56M3hic1V6U2JhODdBVHZGX2ZWZ3xBQ3Jtc0tudjd0Nk1KMXQ0R0VzWk1FVGJOMHFQcnRRTUk1Vkp1VDdNeGtNcnhXUmhWUnBKYXBJRGdSQW5ZR2lzZ2F1Z21IOTlkbjJRdVg4MWZudW1Hd1lkOEs2TjZmYUFJeXlyX3I0ekgycEVpd1QwaHhUME41OA&q=http%3A%2F%2Fgg.gg%2F12b5fu&v=lFJqlqqoH6g", redirectedPage)

            redirectedBrowser.close()


            /*          const [redirectedBrowser, redirectedPage] = await createBrowser();
                        await getLocation("https://www.youtube.com/redirect?event=video_description&redir_token=QUFFLUhqbVFnM21SLW56M3hic1V6U2JhODdBVHZGX2ZWZ3xBQ3Jtc0tudjd0Nk1KMXQ0R0VzWk1FVGJOMHFQcnRRTUk1Vkp1VDdNeGtNcnhXUmhWUnBKYXBJRGdSQW5ZR2lzZ2F1Z21IOTlkbjJRdVg4MWZudW1Hd1lkOEs2TjZmYUFJeXlyX3I0ekgycEVpd1QwaHhUME41OA&q=http%3A%2F%2Fgg.gg%2F12b5fu&v=lFJqlqqoH6g",redirectedPage)
            
                        redirectedBrowser.close() */

        })
    } catch (e) {
        console.log(e)
    }
}

start()