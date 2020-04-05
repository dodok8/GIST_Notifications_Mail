const axios = require("axios");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");

const endpoint = "https://college.gist.ac.kr/prog/bbsArticle/BBSMSTR_000000005587/list.do";
const ID = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;

const getHTML = async () => {
    try {
        return await axios.get(endpoint);
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
                fixed: isNaN($(this).find("td:nth-child(1)").text()),
                title: $(this).find("td.subject > a").text(),
                date: new Date(Date.parse($(this).find("td:nth-child(5)").text())),
            };
        });

        return ulList;
    })
    .then((ulList) => {
        const today = new Date();
        const currDay = 24 * 60 * 60 * 1000;
        const criteriaDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const bodyList =
            "<ul>" +
            ulList
                .filter((article) => parseInt((criteriaDate - article.date) / currDay) < 5 || article.fixed)
                .map((article) => {
                    const tags = `<li>${article.title} ${article.date.toISOString().substring(0, 10)}</li>`;
                    return tags;
                })
                .reduce((accumulator, currentValue) => accumulator + currentValue) +
            "</ul>";

        return bodyList;
    })
    .then((bodyList) => {
        const today = new Date();
        const header = `${today.getMonth() + 1}월 ${today.getDate()}일 GIST 대학 공지`;
        const mailbody = `<h1><a href="${endpoint}">${header}</a></h1>` + "\n" + bodyList;
        const transporter = nodemailer.createTransport({
            service: "Outlook365",
            auth: {
                user: ID,
                pass: PASSWORD,
            },
        });

        const mailOption = {
            from: ID,
            to: ID,
            subject: header,
            html: mailbody,
        };

        try {
            transporter.sendMail(mailOption);
        } catch (error) {
            console.error(error);
        }
    });
