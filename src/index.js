const axios = require("axios");
const cheerio = require("cheerio");

const getHTML = async () => {
    try {
        return await axios.get("https://college.gist.ac.kr/prog/bbsArticle/BBSMSTR_000000005587/list.do");
    } catch (error) {
        console.error(error);
    }
};

getHTML()
    .then((html) => {
        let ulList = [];
        const $ = cheerio.load(html.data);
        const $bodyList = $("#txt > div > div.no-more-tables > table > tbody > tr");
        $bodyList.each(function (i, elem) {
            ulList[i] = {
                title: $(this).find("td.subject > a").text(),
                date: new Date(Date.parse($(this).find("td:nth-child(5)").text())),
            };
        });

        return ulList;
    })
    .then((ulList) => {
        console.log(ulList);
    });